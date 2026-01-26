import hre from "hardhat";
import assert from "node:assert/strict";

describe("JobPortal", function () {
  it("supports employer posting, seeker applying, and status updates", async function () {
    const [employer, jobSeeker] = await hre.ethers.getSigners();

    const JobPortal = await hre.ethers.getContractFactory("JobPortal");
    const jobPortal = await JobPortal.deploy();
    await jobPortal.waitForDeployment();

    // Register roles: 1 = JobSeeker, 2 = Employer
    await (await jobPortal.connect(employer).register(2)).wait();
    await (await jobPortal.connect(jobSeeker).register(1)).wait();

    await (
      await jobPortal
        .connect(employer)
        .createJob(
          "Frontend Developer",
          "Job Chain Labs",
          "Remote",
          "Full-time",
          "bafybeigdyr-job-desc-demo"
        )
    ).wait();

    const count = await jobPortal.getJobsCount();
    assert.equal(count.toString(), "1");

    const job = await jobPortal.getJob(0);
    assert.equal(job.employer, employer.address);
    assert.equal(job.title, "Frontend Developer");
    assert.equal(job.isOpen, true);

    await (
      await jobPortal.connect(jobSeeker).applyToJob(0, "bafybeigdyr-resume-demo")
    ).wait();

    const app = await jobPortal.getApplication(0, jobSeeker.address);
    assert.equal(app.resumeCID, "bafybeigdyr-resume-demo");
    assert.equal(app.status, 1); // Applied

    // 2 = Shortlisted
    await (
      await jobPortal.connect(employer).setApplicationStatus(0, jobSeeker.address, 2)
    ).wait();

    const app2 = await jobPortal.getApplication(0, jobSeeker.address);
    assert.equal(app2.status, 2);
  });
});
