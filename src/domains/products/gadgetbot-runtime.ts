/**
 * GadgetBot ManagedRuntime
 *
 * Creates a ManagedRuntime for the GadgetBot service that can be used
 * to execute Effect operations from external systems (REPL, web, CLI).
 */

import { ManagedRuntime } from "effect"
import { GadgetBotService } from "./gadgetbot-service"

/**
 * Managed runtime for GadgetBot service
 *
 * This runtime provides all the dependencies needed for GadgetBot operations.
 * It should be disposed when the application shuts down.
 */
export const GadgetBotRuntime = ManagedRuntime.make(GadgetBotService.Default)
