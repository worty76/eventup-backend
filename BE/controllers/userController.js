const { User, CTVProfile, BTCProfile } = require('../models');

// @desc    Get current user profile
// @route   GET /api/users/me
// @access  Private
exports.getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);

    let profile = null;
    if (user.role === 'CTV') {
      profile = await CTVProfile.findOne({ userId: user._id });
    } else if (user.role === 'BTC') {
      profile = await BTCProfile.findOne({ userId: user._id });
    }

    res.status(200).json({
      success: true,
      data: {
        user,
        profile
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update current user profile
// @route   PUT /api/users/me
// @access  Private
exports.updateMe = async (req, res, next) => {
  try {
    const { phone, ...profileData } = req.body;

    // Update user basic info
    if (phone) {
      await User.findByIdAndUpdate(req.user._id, { phone });
    }

    // Update profile based on role
    let profile;
    if (req.user.role === 'CTV') {
      profile = await CTVProfile.findOneAndUpdate(
        { userId: req.user._id },
        profileData,
        { new: true, runValidators: true }
      );
    } else if (req.user.role === 'BTC') {
      profile = await BTCProfile.findOneAndUpdate(
        { userId: req.user._id },
        profileData,
        { new: true, runValidators: true }
      );
    }

    res.status(200).json({
      success: true,
      data: profile
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get CTV CV/Profile
// @route   GET /api/ctv/cv
// @access  Private (CTV only)
exports.getCTVCV = async (req, res, next) => {
  try {
    const profile = await CTVProfile.findOne({ userId: req.user._id })
      .populate('joinedEvents.eventId', 'title eventType startTime endTime');

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: 'Profile not found'
      });
    }

    res.status(200).json({
      success: true,
      data: profile
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update CTV CV/Profile
// @route   PUT /api/ctv/cv
// @access  Private (CTV only)
exports.updateCTVCV = async (req, res, next) => {
  try {
    const { fullName, avatar, gender, address, skills, experiences } = req.body;

    const profile = await CTVProfile.findOneAndUpdate(
      { userId: req.user._id },
      { fullName, avatar, gender, address, skills, experiences },
      { new: true, runValidators: true }
    );

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: 'Profile not found'
      });
    }

    res.status(200).json({
      success: true,
      data: profile
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get BTC Profile
// @route   GET /api/btc/profile
// @access  Private (BTC only)
exports.getBTCProfile = async (req, res, next) => {
  try {
    const profile = await BTCProfile.findOne({ userId: req.user._id })
      .populate('successfulEvents', 'title eventType startTime endTime');

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: 'Profile not found'
      });
    }

    res.status(200).json({
      success: true,
      data: profile
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update BTC Profile
// @route   PUT /api/btc/profile
// @access  Private (BTC only)
exports.updateBTCProfile = async (req, res, next) => {
  try {
    const { agencyName, logo, address, website, fanpage, description } = req.body;

    const profile = await BTCProfile.findOneAndUpdate(
      { userId: req.user._id },
      { agencyName, logo, address, website, fanpage, description },
      { new: true, runValidators: true }
    );

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: 'Profile not found'
      });
    }

    res.status(200).json({
      success: true,
      data: profile
    });
  } catch (error) {
    next(error);
  }
};
