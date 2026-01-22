const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const User = require("../models/User");
const { CTVProfile, BTCProfile } = require("../models");
const { sendEmail } = require("../utils/email");
const { OAuth2Client } = require("google-auth-library");

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// Generate JWT Token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE,
  });
};

// Generate Refresh Token
const generateRefreshToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_REFRESH_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRE,
  });
};

// Send token response
const sendTokenResponse = (user, statusCode, res) => {
  const token = generateToken(user._id);
  const refreshToken = generateRefreshToken(user._id);

  const options = {
    expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
  };

  res
    .status(statusCode)
    .cookie("token", token, options)
    .json({
      success: true,
      token,
      refreshToken,
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
        status: user.status,
      },
    });
};

// @desc    Register CTV
// @route   POST /api/auth/register/ctv
// @access  Public
exports.registerCTV = async (req, res, next) => {
  try {
    const { email, password, fullName, phone, gender, address } = req.body;

    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "Email already registered",
      });
    }

    // Create user
    const user = await User.create({
      email,
      passwordHash: password,
      role: "CTV",
      phone,
      status: "PENDING", // Need to verify email
    });

    // Create CTV profile
    await CTVProfile.create({
      userId: user._id,
      fullName,
      gender: gender || "OTHER",
      address,
    });

    // Generate OTP and send verification email
    const otp = crypto.randomInt(100000, 999999).toString();
    user.otp = {
      code: otp,
      expiresAt: new Date(
        Date.now() + parseInt(process.env.OTP_EXPIRE_MINUTES) * 60000,
      ),
    };
    await user.save();

    // Send OTP email
    await sendEmail({
      to: email,
      subject: "Verify Your Account",
      text: `Your OTP code is: ${otp}. Valid for ${process.env.OTP_EXPIRE_MINUTES} minutes.`,
    });

    res.status(201).json({
      success: true,
      message:
        "Registration successful. Please check your email for OTP verification.",
      userId: user._id,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Register BTC
// @route   POST /api/auth/register/btc
// @access  Public
exports.registerBTC = async (req, res, next) => {
  try {
    const { email, password, agencyName, phone, address, logoUrl } = req.body;

    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "Email already registered",
      });
    }

    // Create user
    const user = await User.create({
      email,
      passwordHash: password,
      role: "BTC",
      phone,
      status: "PENDING",
    });

    // Create BTC profile
    await BTCProfile.create({
      userId: user._id,
      agencyName,
      address,
      logo: logoUrl,
    });

    // Generate OTP
    const otp = crypto.randomInt(100000, 999999).toString();
    user.otp = {
      code: otp,
      expiresAt: new Date(
        Date.now() + parseInt(process.env.OTP_EXPIRE_MINUTES) * 60000,
      ),
    };
    await user.save();

    // Send OTP email
    await sendEmail({
      to: email,
      subject: "Verify Your Account",
      text: `Your OTP code is: ${otp}. Valid for ${process.env.OTP_EXPIRE_MINUTES} minutes.`,
    });

    res.status(201).json({
      success: true,
      message:
        "Registration successful. Please check your email for OTP verification.",
      userId: user._id,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Send OTP
// @route   POST /api/auth/send-otp
// @access  Public
exports.sendOTP = async (req, res, next) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Generate OTP
    const otp = crypto.randomInt(100000, 999999).toString();
    user.otp = {
      code: otp,
      expiresAt: new Date(
        Date.now() + parseInt(process.env.OTP_EXPIRE_MINUTES) * 60000,
      ),
    };
    await user.save();

    // Send OTP email
    await sendEmail({
      to: email,
      subject: "Your OTP Code",
      text: `Your OTP code is: ${otp}. Valid for ${process.env.OTP_EXPIRE_MINUTES} minutes.`,
    });

    res.status(200).json({
      success: true,
      message: "OTP sent successfully",
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Verify OTP
// @route   POST /api/auth/verify-otp
// @access  Public
exports.verifyOTP = async (req, res, next) => {
  try {
    const { email, otp } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (!user.otp || !user.otp.code) {
      return res.status(400).json({
        success: false,
        message: "No OTP found. Please request a new one.",
      });
    }

    if (user.otp.expiresAt < new Date()) {
      return res.status(400).json({
        success: false,
        message: "OTP has expired",
      });
    }

    if (user.otp.code !== otp) {
      return res.status(400).json({
        success: false,
        message: "Invalid OTP",
      });
    }

    // Verify user
    user.isEmailVerified = true;
    user.status = "ACTIVE";
    user.otp = undefined;
    await user.save();

    sendTokenResponse(user, 200, res);
  } catch (error) {
    next(error);
  }
};

// @desc    Login
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res, next) => {
  try {
    const { email, password, role } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Please provide email and password",
      });
    }

    // Check for user
    const user = await User.findOne({ email }).select("+passwordHash");
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    // Check role if provided
    if (role && user.role !== role) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials for this role",
      });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    // Check if account is active
    if (user.status === "BLOCKED") {
      return res.status(403).json({
        success: false,
        message: "Your account has been blocked",
      });
    }

    if (user.status === "PENDING") {
      return res.status(403).json({
        success: false,
        message: "Please verify your email first",
      });
    }

    sendTokenResponse(user, 200, res);
  } catch (error) {
    next(error);
  }
};

// @desc    Refresh Token
// @route   POST /api/auth/refresh-token
// @access  Public
exports.refreshToken = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(401).json({
        success: false,
        message: "Refresh token is required",
      });
    }

    try {
      const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
      const user = await User.findById(decoded.id);

      if (!user) {
        return res.status(401).json({
          success: false,
          message: "User not found",
        });
      }

      sendTokenResponse(user, 200, res);
    } catch (err) {
      return res.status(401).json({
        success: false,
        message: "Invalid refresh token",
      });
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Google Login (callback handler)
// @route   POST /api/auth/google
// @access  Public
exports.googleLogin = async (req, res, next) => {
  try {
    const { idToken, role } = req.body;

    if (!idToken) {
      return res.status(400).json({
        success: false,
        message: "Google ID Token is required",
      });
    }

    // Verify Google Token (Access Token approach)
    // Verify token info to get sub (googleId) and validate audience (optional but recommended)
    const tokenInfo = await client.getTokenInfo(idToken);

    // Fetch User Info using Access Token
    const userInfoResponse = await fetch(
      `https://www.googleapis.com/oauth2/v3/userinfo?access_token=${idToken}`,
    );
    const userInfo = await userInfoResponse.json();

    if (!userInfoResponse.ok) {
      throw new Error("Failed to fetch user info from Google");
    }

    const { email, name, picture, sub: googleId } = userInfo;

    // Check if user exists
    let user = await User.findOne({ email });

    if (user) {
      // If user exists but no googleId (registered via email/password), link it
      if (!user.googleId) {
        user.googleId = googleId;
        user.isEmailVerified = true; // Google email is verified
        await user.save();
      }

      // If user is BLOCKED
      if (user.status === "BLOCKED") {
        return res.status(403).json({
          success: false,
          message: "Your account has been blocked",
        });
      }

      return sendTokenResponse(user, 200, res);
    }

    // New User - Role is required
    if (!role) {
      return res.status(400).json({
        success: false,
        message: "Role is required for new registration",
      });
    }

    // Create User
    user = await User.create({
      email,
      role,
      googleId,
      status: "ACTIVE",
      isEmailVerified: true,
      passwordHash: await crypto.randomBytes(32).toString("hex"), // Random password
    });

    // Create Profile
    if (role === "CTV") {
      await CTVProfile.create({
        userId: user._id,
        fullName: name,
        avatar: picture,
        gender: "OTHER",
      });
    } else if (role === "BTC") {
      await BTCProfile.create({
        userId: user._id,
        agencyName: name, // Default to Google Name
        logo: picture,
        verified: false,
      });
    }

    sendTokenResponse(user, 201, res);
  } catch (error) {
    console.error("Google Login Error:", error);
    res.status(401).json({
      success: false,
      message: "Invalid Google Token",
    });
  }
};

// @desc    Logout
// @route   POST /api/auth/logout
// @access  Private
exports.logout = async (req, res, next) => {
  try {
    res.cookie("token", "none", {
      expires: new Date(Date.now() + 10 * 1000),
      httpOnly: true,
    });

    res.status(200).json({
      success: true,
      message: "Logged out successfully",
    });
  } catch (error) {
    next(error);
  }
};
