import 'dotenv/config';

import './lib/network.js';

import { startUploadWorker } from './services/uploadWorker.js';

startUploadWorker();