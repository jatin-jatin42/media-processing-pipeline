import mongoose from "mongoose";
import bcrypt from "bcrypt"
import jwt from "jsonwebtoken";

const userSchema = mongoose.Schema(
    {
        username: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
            index: true
        },
        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true
        },
        fullName: {
            type: String,
            required: true,
            index: true,
        },
        password: {
            type: String,
            required: [true, "password is required"],
        },
        avatar: {
            type: String,
            default: ""
        },
        // RBAC — controls what this user is permitted to do
        role: {
            type: String,
            enum: ["Viewer", "Editor", "Admin"],
            default: "Viewer"
        },
        // Multi-Tenancy: grouping users by organization/group
        tenantId: {
            type: String,
            required: true,
            default: "default-tenant", // Default for existing data
            index: true
        },
        refreshToken: {
            type: String
        }
    },
    {
        timestamps: true
    }
)

userSchema.pre("save", async function (next) {
    if (!this.isModified("password")) return next();
    this.password = await bcrypt.hash(this.password, 10);
    next();
})

userSchema.methods.isPasswordCorrect = async function (password) {
    return await bcrypt.compare(password, this.password);
}

userSchema.methods.generateAccessToken = function () {
    return jwt.sign(
        {
            _id: this._id,
            role: this.role   // embed role so middleware can authorize without DB lookup
        },
        process.env.ACCESS_TOKEN_SECRET,
        { expiresIn: process.env.ACCESS_TOKEN_EXPIRY || "1d" }
    );
}

userSchema.methods.generateRefreshToken = function () {
    return jwt.sign(
        { _id: this._id },
        process.env.REFRESH_TOKEN_SECRET,
    {
        expiresIn: process.env.REFRESH_TOKEN_EXPIRY
    }
)
}

export const User = mongoose.model("User", userSchema);