// Plan Gate Controller for managing contextual plan gates
export class PlanGateController {
  private cooldown = 90; // seconds
  private lastShown = 0;
  private storageKey = 'planGateLastShown';

  constructor() {
    // Load last shown time from localStorage
    const stored = localStorage.getItem(this.storageKey);
    if (stored) {
      this.lastShown = parseInt(stored, 10);
    }
  }

  shouldShowGate(trigger: 'tour_end' | 'tour_skip' | 'blocked_action'): boolean {
    const now = Date.now() / 1000;
    const timeSinceLastShown = now - this.lastShown;
    
    if (timeSinceLastShown < this.cooldown) {
      console.log(`🚫 Plan gate cooldown active. ${Math.ceil(this.cooldown - timeSinceLastShown)}s remaining`);
      return false;
    }
    
    this.lastShown = now;
    localStorage.setItem(this.storageKey, this.lastShown.toString());
    
    console.log(`✅ Plan gate can be shown for trigger: ${trigger}`);
    return true;
  }

  resetCooldown(): void {
    this.lastShown = 0;
    localStorage.removeItem(this.storageKey);
  }

  getCooldownRemaining(): number {
    const now = Date.now() / 1000;
    const timeSinceLastShown = now - this.lastShown;
    return Math.max(0, this.cooldown - timeSinceLastShown);
  }
}

export const planGateController = new PlanGateController();
