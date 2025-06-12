import { EventEmitter } from "events";
import { getSupastashConfig } from "../../core/config";
export const supastashEventBus = new EventEmitter();
supastashEventBus.setMaxListeners(getSupastashConfig()?.listeners || 250);
