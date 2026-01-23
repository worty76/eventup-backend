const { Application, Event, CTVProfile, Notification } = require("../models");

// @desc    Apply to event (CTV)
// @route   POST /api/events/:eventId/apply
// @access  Private (CTV)
exports.applyToEvent = async (req, res, next) => {
  try {
    const { eventId } = req.params;
    const { coverLetter } = req.body;
    const ctvId = req.user._id;

    // Check if event exists
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({
        success: false,
        message: "Event not found",
      });
    }

    // Check if event can receive applications
    if (!event.canApply()) {
      return res.status(400).json({
        success: false,
        message: "This event is not accepting applications",
      });
    }

    // Check if already applied
    const existingApplication = await Application.findOne({ eventId, ctvId });
    if (existingApplication) {
      return res.status(400).json({
        success: false,
        message: "You have already applied to this event",
      });
    }

    // Create application
    const application = await Application.create({
      eventId,
      ctvId,
      coverLetter,
      status: "PENDING",
    });

    // Update event applied count
    event.appliedCount += 1;
    await event.save();

    // Create notification for BTC
    await Notification.create({
      userId: event.btcId,
      type: "APPLICATION",
      title: "New Application",
      content: `New applicant for event: ${event.title}`,
      relatedId: application._id,
      relatedModel: "Application",
    });

    res.status(201).json({
      success: true,
      data: application,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get CTV's applications
// @route   GET /api/ctv/applications
// @access  Private (CTV)
exports.getCTVApplications = async (req, res, next) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;

    const query = { ctvId: req.user._id };
    if (status) {
      query.status = status;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const applications = await Application.find(query)
      .populate("eventId", "title location startTime endTime salary eventType")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Application.countDocuments(query);

    res.status(200).json({
      success: true,
      count: applications.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit)),
      data: applications,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get applications for an event (BTC)
// @route   GET /api/btc/events/:eventId/applications
// @access  Private (BTC)
exports.getEventApplications = async (req, res, next) => {
  try {
    const { eventId } = req.params;
    const { status, page = 1, limit = 10 } = req.query;

    // Check if event exists and belongs to BTC
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({
        success: false,
        message: "Event not found",
      });
    }

    if (event.btcId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to view applications for this event",
      });
    }

    const query = { eventId };
    if (status) {
      query.status = status;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const applications = await Application.find(query)
      .populate({
        path: "ctvId",
        select: "email phone role status",
      })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const applicationsWithProfile = await Promise.all(
      applications.map(async (app) => {
        const ctvProfile = await CTVProfile.findOne({
          userId: app.ctvId._id,
        }).select("fullName avatar skills experiences reputation");

        return {
          ...app.toObject(),
          ctvProfile: ctvProfile || null,
        };
      }),
    );

    const total = await Application.countDocuments(query);

    res.status(200).json({
      success: true,
      count: applicationsWithProfile.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit)),
      data: applicationsWithProfile, // ✅ Đổi từ applications → applicationsWithProfile
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Approve application (BTC)
// @route   POST /api/btc/applications/:id/approve
// @access  Private (BTC)
exports.approveApplication = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { assignedRole } = req.body;

    const application = await Application.findById(id).populate("eventId");
    if (!application) {
      return res.status(404).json({
        success: false,
        message: "Application not found",
      });
    }

    // Check ownership
    if (application.eventId.btcId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Not authorized",
      });
    }

    application.status = "APPROVED";
    if (assignedRole) {
      application.assignedRole = assignedRole;
    }
    await application.save();

    // Create notification for CTV
    await Notification.create({
      userId: application.ctvId,
      type: "APPROVAL",
      title: "Application Approved",
      content: `Your application for "${application.eventId.title}" has been approved`,
      relatedId: application._id,
      relatedModel: "Application",
    });

    res.status(200).json({
      success: true,
      data: application,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Reject application (BTC)
// @route   POST /api/btc/applications/:id/reject
// @access  Private (BTC)
exports.rejectApplication = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { rejectionReason } = req.body;

    const application = await Application.findById(id).populate("eventId");
    if (!application) {
      return res.status(404).json({
        success: false,
        message: "Application not found",
      });
    }

    // Check ownership
    if (application.eventId.btcId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Not authorized",
      });
    }

    application.status = "REJECTED";
    if (rejectionReason) {
      application.rejectionReason = rejectionReason;
    }
    await application.save();

    // Create notification for CTV
    await Notification.create({
      userId: application.ctvId,
      type: "REJECTION",
      title: "Application Rejected",
      content: `Your application for "${application.eventId.title}" has been rejected`,
      relatedId: application._id,
      relatedModel: "Application",
    });

    res.status(200).json({
      success: true,
      data: application,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Bulk approve applications (Premium BTC)
// @route   POST /api/btc/applications/bulk-approve
// @access  Private (BTC + Premium)
exports.bulkApproveApplications = async (req, res, next) => {
  try {
    const { applicationIds, role } = req.body;

    if (!Array.isArray(applicationIds) || applicationIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Application IDs are required",
      });
    }

    // Get all applications
    const applications = await Application.find({
      _id: { $in: applicationIds },
    }).populate("eventId");

    // Check ownership for all applications
    const unauthorized = applications.some(
      (app) => app.eventId.btcId.toString() !== req.user._id.toString(),
    );

    if (unauthorized) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to approve some applications",
      });
    }

    // Bulk update
    await Application.updateMany(
      { _id: { $in: applicationIds } },
      {
        status: "APPROVED",
        ...(role && { assignedRole: role }),
      },
    );

    // Create notifications
    const notificationPromises = applications.map((app) =>
      Notification.create({
        userId: app.ctvId,
        type: "APPROVAL",
        title: "Application Approved",
        content: `Your application for "${app.eventId.title}" has been approved`,
        relatedId: app._id,
        relatedModel: "Application",
      }),
    );

    await Promise.all(notificationPromises);

    res.status(200).json({
      success: true,
      message: `${applicationIds.length} applications approved successfully`,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Bulk reject applications (Premium BTC)
// @route   POST /api/btc/applications/bulk-reject
// @access  Private (BTC + Premium)
exports.bulkRejectApplications = async (req, res, next) => {
  try {
    const { applicationIds, rejectionReason } = req.body;

    if (!Array.isArray(applicationIds) || applicationIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Application IDs are required",
      });
    }

    // Get all applications
    const applications = await Application.find({
      _id: { $in: applicationIds },
    }).populate("eventId");

    // Check ownership for all applications
    const unauthorized = applications.some(
      (app) => app.eventId.btcId.toString() !== req.user._id.toString(),
    );

    if (unauthorized) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to reject some applications",
      });
    }

    // Bulk update
    await Application.updateMany(
      { _id: { $in: applicationIds } },
      {
        status: "REJECTED",
        ...(rejectionReason && { rejectionReason }),
      },
    );

    // Create notifications
    const notificationPromises = applications.map((app) =>
      Notification.create({
        userId: app.ctvId,
        type: "REJECTION",
        title: "Application Rejected",
        content: `Your application for "${app.eventId.title}" has been rejected`,
        relatedId: app._id,
        relatedModel: "Application",
      }),
    );

    await Promise.all(notificationPromises);

    res.status(200).json({
      success: true,
      message: `${applicationIds.length} applications rejected successfully`,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Complete application (BTC)
// @route   POST /api/applications/:id/complete
// @access  Private (BTC)
exports.completeApplication = async (req, res, next) => {
  try {
    const { id } = req.params;

    const application = await Application.findById(id).populate("eventId");
    if (!application) {
      return res.status(404).json({
        success: false,
        message: "Application not found",
      });
    }

    // Check ownership
    if (application.eventId.btcId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Not authorized",
      });
    }

    // Only APPROVED applications can be completed
    if (application.status !== "APPROVED") {
      return res.status(400).json({
        success: false,
        message: "Only approved applications can be marked as completed",
      });
    }

    application.status = "COMPLETED";
    await application.save();

    // Create notification for CTV
    await Notification.create({
      userId: application.ctvId,
      type: "COMPLETION",
      title: "Event Completed",
      content: `You have successfully completed the event "${application.eventId.title}"`,
      relatedId: application._id,
      relatedModel: "Application",
    });

    // Update CTV Trust Score (+1)
    const ctvProfile = await CTVProfile.findOne({ userId: application.ctvId });
    if (ctvProfile) {
      ctvProfile.updateTrustScore(1);

      // Also add to joinedEvents if not exists
      const alreadyJoined = ctvProfile.joinedEvents.some(
        (e) => e.eventId.toString() === application.eventId._id.toString(),
      );

      if (!alreadyJoined) {
        ctvProfile.joinedEvents.push({
          eventId: application.eventId._id,
          role: application.assignedRole,
          joinedAt: new Date(),
        });
      }

      await ctvProfile.save();
    }

    res.status(200).json({
      success: true,
      data: application,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get CTV dashboard stats
// @route   GET /api/applications/ctv/dashboard/stats
// @access  Private (CTV)
exports.getCTVDashboardStats = async (req, res, next) => {
  try {
    const ctvId = req.user._id;

    // 1. Total applications
    const totalApplications = await Application.countDocuments({ ctvId });

    // 2. Approved/Completed count
    const approvedCount = await Application.countDocuments({
      ctvId,
      status: "APPROVED",
    });

    const completedCount = await Application.countDocuments({
      ctvId,
      status: "COMPLETED",
    });

    // 3. Pending count
    const pendingCount = await Application.countDocuments({
      ctvId,
      status: "PENDING",
    });

    // 4. Rejected count
    const rejectedCount = await Application.countDocuments({
      ctvId,
      status: "REJECTED",
    });

    // 5. Get upcoming events (approved applications for future events)
    const upcomingEvents = await Application.find({
      ctvId,
      status: { $in: ["APPROVED"] },
    })
      .populate({
        path: "eventId",
        select: "title location startTime endTime eventType",
        match: { startTime: { $gte: new Date() } },
      })
      .limit(5)
      .sort({ "eventId.startTime": 1 });

    const upcomingEventsFiltered = upcomingEvents
      .filter((app) => app.eventId)
      .map((app) => ({
        _id: app.eventId._id,
        title: app.eventId.title,
        location: app.eventId.location,
        startTime: app.eventId.startTime,
        endTime: app.eventId.endTime,
        eventType: app.eventId.eventType,
        role: app.assignedRole,
      }));

    // 6. Chart Data (Applications by status for pie chart or last 7 days activity)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    const recentActivity = await Application.aggregate([
      {
        $match: {
          ctvId: req.user._id,
          updatedAt: { $gte: sevenDaysAgo },
        },
      },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$updatedAt" } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // Fill missing days
    const chartData = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      const dateString = d.toISOString().split("T")[0];
      const found = recentActivity.find((a) => a._id === dateString);

      const displayDate = `${d.getDate()}/${d.getMonth() + 1}`;

      chartData.push({
        name: displayDate,
        fullDate: dateString,
        value: found ? found.count : 0,
      });
    }

    res.status(200).json({
      success: true,
      data: {
        totalApplications,
        approvedCount,
        completedCount,
        pendingCount,
        rejectedCount,
        eventsJoined: completedCount, // Completed = events joined
        upcomingEvents: upcomingEventsFiltered,
        chartData,
      },
    });
  } catch (error) {
    next(error);
  }
};
