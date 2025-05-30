import { getSupastashConfig } from "@/core/config";

import { EventEmitter } from "events";
export const eventBus = new EventEmitter();
eventBus.setMaxListeners(getSupastashConfig().listeners);
