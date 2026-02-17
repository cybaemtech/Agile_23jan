import { db } from "./db";
import { users, teams, teamMembers, projects, workItems, comments } from "../shared/schema";
import bcrypt from "bcryptjs";

async function seed() {
  console.log("🌱 Seeding database...");

  try {
    // 1. Create Users
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash("Admin@123", salt);
    const scrumPassword = await bcrypt.hash("Scrum@123", salt);
    const userPassword = await bcrypt.hash("User@123", salt);

    console.log("Creating users...");
    const [adminUser] = await db.insert(users).values({
      username: "admin",
      email: "admin@company.com",
      fullName: "Sarah Johnson",
      password: hashedPassword,
      role: "ADMIN",
    }).returning();

    const [scrumMaster] = await db.insert(users).values({
      username: "scrum",
      email: "scrum@company.com",
      fullName: "Michael Chen",
      password: scrumPassword,
      role: "SCRUM_MASTER",
    }).returning();

    const [developer] = await db.insert(users).values({
      username: "dev",
      email: "dev@company.com",
      fullName: "Alex Rivera",
      password: userPassword,
      role: "USER",
    }).returning();

    // 2. Create Team
    console.log("Creating team...");
    const [alphaTeam] = await db.insert(teams).values({
      name: "Alpha Squad",
      description: "Core development team for the platform",
      createdBy: adminUser.id,
    }).returning();

    // 3. Add members to team
    console.log("Adding team members...");
    await db.insert(teamMembers).values([
      { teamId: alphaTeam.id, userId: adminUser.id, role: "ADMIN" },
      { teamId: alphaTeam.id, userId: scrumMaster.id, role: "MEMBER" },
      { teamId: alphaTeam.id, userId: developer.id, role: "MEMBER" },
    ]);

    // 4. Create Project
    console.log("Creating project...");
    const [project] = await db.insert(projects).values({
      key: "ECOMM",
      name: "E-Commerce Platform",
      description: "Next-gen shopping experience",
      category: "IN_HOUSE",
      status: "ACTIVE",
      createdBy: adminUser.id,
      teamId: alphaTeam.id,
    }).returning();

    // 5. Create Work Items
    console.log("Creating work items...");
    const [epic] = await db.insert(workItems).values({
      externalId: "ECOMM-001",
      title: "User Authentication System",
      description: "Implement secure login and registration",
      type: "EPIC",
      status: "IN_PROGRESS",
      priority: "HIGH",
      projectId: project.id,
      reporterId: scrumMaster.id,
    }).returning();

    const [story] = await db.insert(workItems).values({
      externalId: "ECOMM-002",
      title: "OTP Verification",
      description: "Add email-based one-time password",
      type: "STORY",
      status: "TODO",
      priority: "MEDIUM",
      projectId: project.id,
      parentId: epic.id,
      assigneeId: developer.id,
      reporterId: scrumMaster.id,
    }).returning();

    // 6. Add Comment
    console.log("Adding comment...");
    await db.insert(comments).values({
      workItemId: story.id,
      userId: adminUser.id,
      content: "This is a critical security feature.",
    });

    console.log("✅ Seeding completed successfully!");
  } catch (error) {
    console.error("❌ Seeding failed:", error);
    process.exit(1);
  }
}

seed().then(() => process.exit(0));
