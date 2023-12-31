import PgBoss from 'pg-boss';
import readSecretSync from '../utils/readSecretSync.js';
import { dbGetAllMonitors } from './queries.js';
import { calculateStartDelay, calculateSoloDelay } from '../utils/calculateDelays.js';
import startWorker from '../workers/startWorker.js';
import endWorker from '../workers/endWorker.js';
import soloWorker from '../workers/soloWorker.js';
import maintenanceWorker from '../workers/maintenanceWorker.js';
import dailyReportWorker from '../workers/dailyReportWorker.js';

const MissedPingsMq = {
  boss: null,
  startJobs: {},
  endJobs: {},
  soloJobs: {},

  async init() {
    const password = readSecretSync();
    const credentials = {
      user: process.env.POSTGRES_USER,
      host: process.env.POSTGRES_HOST,
      database: process.env.POSTGRES_DB,
      password: password,
      port: 5432,
    };

    this.boss = new PgBoss(credentials);
    this.boss.on('error', error => console.error(error));

    await this.boss.start();
    await this.boss.deleteAllQueues();

    const options = {
      teamSize: 100,
      teamConcurrency: 100,
    };

    await this.boss.work('start', options, startWorker);
    await this.boss.work('end', options, endWorker);
    await this.boss.work('solo', options, soloWorker);
    await this.boss.work('maintenance', maintenanceWorker);
    await this.boss.work('dailyReport', dailyReportWorker);

    console.log('PgBoss initialized and ready for use.');
  },

  async populateStartSoloQueues() {
    await this.boss.deleteAllQueues();
    const monitors = await dbGetAllMonitors();

    const monitorJobs = monitors.reduce((arr, monitor ) => {
      if (monitor.type === 'dual') {
        arr.push(MissedPingsMq.addStartJob({ monitorId: monitor.id }, calculateStartDelay(monitor)));
      } else {
        arr.push(MissedPingsMq.addSoloJob({ monitorId: monitor.id }, calculateSoloDelay(monitor)));
      }
      return arr;
    }, []);

    Promise.allSettled(monitorJobs);
  },

  async scheduleRunRotation() {
    await this.boss.schedule('maintenance', '0 23 * * 5');
  },

  async scheduleDailyReport() {
    await this.boss.schedule('dailyReport', '0 9 * * 1-5');
  },

  async addStartJob(data, delay) {
    const jobId = await this.boss.send(
      'start',
      data,
      { startAfter: delay, singletonKey: data.monitorId }
    );

    if (jobId) {
      this.startJobs[data.monitorId] = jobId;
    }
  },

  async addEndJob(data, delay) {
    const jobId = await this.boss.send(
      'end',
      data,
      { sendAfter: delay, singletonKey: data.runToken },
    );

    if (jobId) {
      this.endJobs[data.runToken] = jobId;
    }
  },

  async addSoloJob(data, delay) {
    const jobId = await this.boss.send(
      'solo',
      data,
      { sendAfter: delay, singletonKey: data.monitorId }
    );

    if (jobId) {
      this.soloJobs[data.monitorId] = jobId;
    }
  },

  async removeStartJob(monitorId) {
    const jobId = this.startJobs[monitorId];
    if (jobId) {
      delete this.startJobs[monitorId];
      await this.boss.cancel(jobId);
    }
  },

  async removeEndJob(runToken) {
    const jobId = this.endJobs[runToken];
    if (jobId) {
      delete this.endJobs[runToken];
      await this.boss.cancel(jobId);
    }
  },

  async removeSoloJob(monitorId) {
    const jobId = this.soloJobs[monitorId];
    if (jobId) {
      delete this.soloJobs[monitorId];
      await this.boss.cancel(jobId);
    }
  }
};

export default MissedPingsMq;
