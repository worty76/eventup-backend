const {
  Application,
  Event,
  CTVProfile,
  Notification,
  User,
} = require("../models");
const emailService = require("../utils/email");

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
      .populate({
        path: "eventId",
        select: "title location startTime endTime salary eventType btcId",
        populate: {
          path: "btcId",
          select: "agencyName fullName email avatarUrl",
        },
      })
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

// @desc    Report violation (No-show)
// @route   POST /api/applications/:id/violation
// @access  Private (BTC)
exports.reportViolation = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

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

    // Only APPROVED applications can be reported as violation
    if (application.status !== "APPROVED") {
      return res.status(400).json({
        success: false,
        message: "Only approved applications can be reported for violation",
      });
    }

    application.status = "NO_SHOW";
    application.notes = reason || "No-show / Violation reported by Organizer";
    await application.save();

    // Create notification for CTV
    await Notification.create({
      userId: application.ctvId,
      type: "VIOLATION",
      title: "Reported: No-show/Violation",
      content: `You have been reported for violation/no-show in event "${application.eventId.title}". Pending review.`,
      relatedId: application._id,
      relatedModel: "Application",
    });

    // Immediate penalty: Update CTV Trust Score (-2)
    const ctvProfile = await CTVProfile.findOne({ userId: application.ctvId });
    if (ctvProfile) {
      ctvProfile.updateTrustScore(-2); // Direct deduction

      // Add to joinedEvents as history tag
      ctvProfile.joinedEvents.push({
        eventId: application.eventId._id,
        role: "No-show", // Tag as No-show
        joinedAt: new Date(),
      });

      await ctvProfile.save();
    }

    res.status(200).json({
      success: true,
      data: application,
      message: "Violation reported and penalty applied",
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Auto-complete past events (CRON Job logic)
// @access  Internal/Admin
exports.autoCompleteEvents = async () => {
  try {
    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

    // 1. Find events that ended more than 3 days ago
    const pastEvents = await Event.find({
      endTime: { $lt: threeDaysAgo },
    }).select("_id title");

    const pastEventIds = pastEvents.map((e) => e._id);

    if (pastEventIds.length === 0) return 0;

    // 2. Find applications that are still just "APPROVED" for these events
    const pendingApps = await Application.find({
      eventId: { $in: pastEventIds },
      status: "APPROVED",
    });

    let completedCount = 0;

    // 3. Process each application (mark complete + add trust score)
    for (const app of pendingApps) {
      app.status = "COMPLETED";
      await app.save();

      // Notification
      await Notification.create({
        userId: app.ctvId,
        type: "COMPLETION",
        title: "Event Automatically Completed",
        content: `Event "${pastEvents.find((e) => e._id.equals(app.eventId))?.title}" marked as completed.`,
        relatedId: app._id,
        relatedModel: "Application",
      });

      // Trust Score +1
      const ctvProfile = await CTVProfile.findOne({ userId: app.ctvId });
      if (ctvProfile) {
        ctvProfile.updateTrustScore(1);

        // Add to joinedEvents logic (duplicated from completeApplication)
        const alreadyJoined = ctvProfile.joinedEvents.some(
          (e) => e.eventId.toString() === app.eventId.toString(),
        );

        if (!alreadyJoined) {
          ctvProfile.joinedEvents.push({
            eventId: app.eventId,
            role: app.assignedRole,
            joinedAt: new Date(),
          });
        }
        await ctvProfile.save();
      }
      completedCount++;
    }

    console.log(`[Auto-Complete] Processed ${completedCount} applications.`);
    return completedCount;
  } catch (error) {
    console.error("[Auto-Complete] Error:", error);
    return 0;
  }
};

// @desc    Send reminders to BTCs to complete events (24h after end)
// @access  Internal/Admin
exports.sendCompletionReminders = async () => {
  try {
    const twentyFourHoursAgo = new Date();
    twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);

    const twentyFiveHoursAgo = new Date();
    twentyFiveHoursAgo.setHours(twentyFiveHoursAgo.getHours() - 25);

    // 1. Find events that ended between 24 and 25 hours ago
    const events = await Event.find({
      endTime: {
        $lt: twentyFourHoursAgo,
        $gte: twentyFiveHoursAgo,
      },
    }).select("_id title btcId");

    let reminderCount = 0;

    for (const event of events) {
      // Check if there are any APPROVED applications (needing completion/review)
      const hasPendingApps = await Application.exists({
        eventId: event._id,
        status: "APPROVED",
      });

      if (hasPendingApps) {
        // Send notification to BTC
        await Notification.create({
          userId: event.btcId,
          type: "REMINDER",
          title: "Event Completion Reminder",
          content: `It has been 24h since "${event.title}" ended. Please complete the event and review your candidates.`,
          relatedId: event._id,
          relatedModel: "Event",
        });
        reminderCount++;
      }
    }

    console.log(`[Reminder] Sent ${reminderCount} completion reminders.`);
    return reminderCount;
  } catch (error) {
    console.error("[Reminder] Error:", error);
    return 0;
  }
};

// @desc    Send reminders for upcoming events (24h before)
// @access  Internal/Admin
exports.sendPreEventReminders = async () => {
  try {
    const now = new Date();
    const twentyFourHoursFromNow = new Date(
      now.getTime() + 24 * 60 * 60 * 1000,
    );
    const twentyFourHoursTenMinsFromNow = new Date(
      now.getTime() + 24 * 60 * 60 * 1000 + 10 * 60 * 1000,
    );

    // 1. Find events starting in roughly 24 hours (10 min window to avoid duplicates if cron runs every 10 mins)
    // Adjust window based on cron frequency. Assuming cron runs frequently.
    // Actually, better to simply check >= 24h and < 24h + interval.
    // Let's assume cron runs every hour? or every 15 mins?
    // Let's use a wider window and rely on "reminderSent" flag if possible, or just exact window if cron is reliable.
    // For simplicity here, let's assume cron runs every 10 mins.

    const events = await Event.find({
      startTime: {
        $gte: twentyFourHoursFromNow,
        $lt: twentyFourHoursTenMinsFromNow,
      },
      status: { $ne: "CANCELLED" }, // Don't remind cancelled events
    });

    let reminderCount = 0;

    for (const event of events) {
      // Notify BTC
      // In-app
      await Notification.create({
        userId: event.btcId,
        type: "REMINDER",
        title: "Upcoming Event Reminder",
        content: `Your event "${event.title}" starts in 24 hours.`,
        relatedId: event._id,
        relatedModel: "Event",
      });

      // Email BTC
      const btcUser = await require("../models/User").findById(event.btcId);
      if (btcUser) {
        await emailService.sendEmail({
          to: btcUser.email,
          subject: `Reminder: ${event.title} starts tomorrow`,
          text: `Your event "${event.title}" starts in 24 hours. Please get ready.`,
          html: `<p>Your event <strong>${event.title}</strong> starts in 24 hours.</p>`,
        });
      }

      // Notify Approved CTVs
      const applications = await Application.find({
        eventId: event._id,
        status: "APPROVED",
      }).populate("ctvId", "email");

      for (const app of applications) {
        // In-app
        await Notification.create({
          userId: app.ctvId._id,
          type: "REMINDER",
          title: "Event Reminder",
          content: `Event "${event.title}" starts in 24 hours. Don't be late!`,
          relatedId: event._id,
          relatedModel: "Event",
        });

        // Email CTV
        if (app.ctvId && app.ctvId.email) {
          await emailService.sendEmail({
            to: app.ctvId.email,
            subject: `Reminder: ${event.title} starts tomorrow`,
            text: `Event "${event.title}" starts in 24 hours. Please ensure you are prepared. Location: ${event.location}`,
            html: `
                            <div>
                                <h2>Event Reminder</h2>
                                <p>This is a reminder that <strong>${event.title}</strong> starts in 24 hours.</p>
                                <p><strong>Time:</strong> ${new Date(event.startTime).toLocaleString("vi-VN")}</p>
                                <p><strong>Location:</strong> ${event.location}</p>
                                <p>Please arrive on time.</p>
                            </div>
                         `,
          });
        }
      }
      reminderCount++;
    }

    console.log(
      `[Pre-Event Reminder] Sent reminders for ${reminderCount} events.`,
    );
    return reminderCount;
  } catch (error) {
    console.error("[Pre-Event Reminder] Error:", error);
    return 0;
  }
};
