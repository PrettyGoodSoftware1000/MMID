import { CFG } from './config.js';
import { Body } from './body.js';
import { playSfx } from './sound.js';

const P = CFG.player, B = CFG.buster;

// Character-agnostic player. Capabilities (dash, wallKick, fly, charge) come
// from CFG.chars[id]; both X and Rush run through this same state machine.
export class Player {
  constructor(charId, anim, shotAnim, effects, input) {
    this.char = CFG.chars[charId];
    this.charId = charId;
    this.anim = anim; this.shotAnim = shotAnim; this.fx = effects; this.in = input;
    this.body = new Body(this.char.hitW, this.char.hitH);
    this.facing = 1;
    this.hp = P.hp;
    this.state = 'spawn';        // spawn|play|hurt|dead
    this.dashT = 0; this.dashHeld = false; this.dashJump = false;
    this.wallLock = 0; this.wallDir = 0;
    this.flying = false;
    this.fuelMax = this.char.fly ? this.char.flight.fuel : 0;
    this.fuel = this.fuelMax;
    this.charge = 0; this.shootT = 0;
    this.iT = 0; this.hurtT = 0;
    this.coyote = 0; this.jumpBuf = 0;
    this.shots = [];
    this.deadT = 0;
  }

  place(x, y) {
    this.body.x = x; this.body.y = y;
    this.state = 'spawn';
    this.anim.set('teleport_in', true);
    playSfx('teleport');
    this.hp = P.hp; this.iT = 0; this.shots = [];
    this.flying = false; this.fuel = this.fuelMax;
    this.body.vx = 0; this.body.vy = 0;
  }

  get x() { return this.body.x; }
  get y() { return this.body.y; }
  get dead() { return this.state === 'dead' && this.deadT > 70; }
  get alive() { return this.state === 'play' || this.state === 'hurt'; }

  hit(dmg, fromX) {
    if (this.iT > 0 || this.state !== 'play') return;
    this.hp -= dmg;
    this.iT = P.iFrames;
    this.flying = false;
    this.fx.spawn('hit_spark', this.x, this.y - 12, 1);
    playSfx('hurt');
    if (this.hp <= 0) { this.hp = 0; this.state = 'dead'; this.deadT = 0; this.fx.explode(this.x, this.y - 14, '#7ec8ff', 16); return; }
    this.state = 'hurt';
    this.hurtT = P.hurtFrames;
    this.body.vx = (this.x < fromX ? -1 : 1) * P.hurtKnockX;
    this.body.vy = -1.2;
    this.charge = 0;
  }

  update(level) {
    const b = this.body;
    if (this.state === 'dead') { this.deadT++; return; }

    if (this.state === 'spawn') {
      if (!b.onGround) { b.vy = Math.min(b.vy + 1.2, 10); b.moveY(level, b.vy); return; }
      this.anim.tick();
      if (this.anim.finished) this.state = 'play';
      return;
    }

    if (this.state === 'hurt') {
      this.hurtT--;
      b.vy = Math.min(b.vy + CFG.gravity, CFG.maxFall);
      b.moveX(level, b.vx); b.moveY(level, b.vy);
      this.anim.set('hurt'); this.anim.tick();
      if (this.iT > 0) this.iT--;
      if (this.hurtT <= 0) this.state = 'play';
      this._updateShots(level);
      return;
    }

    // ---------- play ----------
    if (this.iT > 0) this.iT--;
    const L = this.in.down('left'), R = this.in.down('right');
    const move = (R ? 1 : 0) - (L ? 1 : 0);

    // ground fuel regen
    if (this.char.fly && b.onGround) this.fuel = Math.min(this.fuelMax, this.fuel + this.char.flight.regen);

    // dash (capability-gated); any dash button dashes in the facing direction
    if (this.char.dash && this.in.pressed('dash') && b.onGround && this.dashT <= 0) {
      this.dashT = CFG.dashFrames; this.dashHeld = true;
      this.facing = move !== 0 ? move : this.facing;
      this.fx.spawn('dash_dust', this.x - this.facing * 10, this.y, this.facing, { sheet: 'misc' });
      playSfx('dash');
    }
    if (!this.in.down('dash')) this.dashHeld = false;
    const dashing = this.char.dash && this.dashT > 0 && b.onGround;
    if (this.dashT > 0) { this.dashT--; if (!this.dashHeld && this.dashT > 4) this.dashT = 4; }

    // ---------- flight (Rush) ----------
    if (this.flying) {
      const F = this.char.flight;
      this.fuel--;
      if (move !== 0) this.facing = move;
      b.vx = move * F.speed;
      const vert = (this.in.down('down') ? 1 : 0) - (this.in.down('up') ? 1 : 0);
      b.vy = vert !== 0 ? vert * F.vSpeed : F.drift;
      b.moveX(level, b.vx);
      b.moveY(level, b.vy);
      if (this.in.pressed('jump') || this.fuel <= 0 || b.onGround) this.flying = false;
      this._shoot(level, 0);
      this._updateShots(level);
      this.anim.set(this.shootT > 0 ? 'fly_shoot' : 'fly');
      this.anim.tick();
      if (b.top() > level.h + 8) { this.hp = 0; this.state = 'dead'; this.deadT = 0; }
      return;
    }

    // horizontal velocity
    if (this.wallLock > 0) {
      this.wallLock--;
      b.vx = -this.wallDir * (this.dashJump ? CFG.wallKick.vxDash : CFG.wallKick.vx);
    } else if (dashing) {
      b.vx = this.facing * CFG.dashSpeed;
      if (move !== 0 && move !== this.facing) this.dashT = 0;
    } else if (move !== 0) {
      this.facing = move;
      b.vx = move * (this.dashJump && !b.onGround ? CFG.dashSpeed : CFG.runSpeed);
    } else b.vx = 0;

    // jumping: buffer + coyote
    this.coyote = b.onGround ? 6 : Math.max(0, this.coyote - 1);
    this.jumpBuf = this.in.pressed('jump') ? 5 : Math.max(0, this.jumpBuf - 1);

    const slidingDir = this.char.wallKick ? this._wallSlideDir(level, move) : 0;
    if (this.jumpBuf > 0) {
      if (this.coyote > 0) {
        b.vy = CFG.jumpVel;
        this.dashJump = this.char.dash && (this.dashT > 0 || dashing || (this.in.down('dash') && Math.abs(b.vx) >= CFG.dashSpeed - 0.1));
        this.dashT = 0; this.coyote = 0; this.jumpBuf = 0;
      } else if (slidingDir !== 0) {
        this.wallDir = slidingDir;
        this.wallLock = CFG.wallKick.lockFrames;
        b.vy = CFG.wallKick.vy;
        this.dashJump = this.in.down('dash');
        this.facing = -slidingDir;
        this.jumpBuf = 0;
        this.anim.set('wall_kick', true);
        this.fx.spawn('wall_dust', this.x + slidingDir * 8, this.y - 8, -slidingDir, { sheet: 'misc' });
        playSfx('dash');
      } else if (this.char.fly && this.fuel > this.char.flight.minFuel) {
        // mid-air jump press = engage flight
        this.flying = true;
        this.jumpBuf = 0;
        b.vy = 0;
        this.fx.spawn('dash_dust', this.x, this.y + 4, this.facing, { sheet: 'misc' });
        return;
      }
    }
    if (this.in.released('jump') && b.vy < CFG.jumpCutVel) b.vy = CFG.jumpCutVel;

    // gravity / wall slide. Holding jump while rising lightens gravity,
    // so a held jump climbs higher than a tap.
    const grav = b.vy < 0 && this.in.down('jump') ? CFG.gravity * CFG.jumpHoldGravity : CFG.gravity;
    if (slidingDir !== 0 && b.vy > 0) b.vy = Math.min(b.vy + grav, CFG.wallSlideMaxFall);
    else b.vy = Math.min(b.vy + grav, CFG.maxFall);

    const dropThrough = this.in.down('down') && this.in.pressed('jump');
    b.moveX(level, b.vx);
    b.moveY(level, b.vy, this.in.down('down') && b.vy > 0 && dropThrough);
    if (b.onGround) this.dashJump = false;

    if (b.top() > level.h + 8) { this.hp = 0; this.state = 'dead'; this.deadT = 0; }

    this._shoot(level, slidingDir);
    this._updateShots(level);
    this._animate(dashing, move, slidingDir);
  }

  _wallSlideDir(level, move) {
    const b = this.body;
    if (b.onGround || move === 0 || b.vy <= 0) return 0;
    if (move > 0 && b.touchingWall(level, 1)) return 1;
    if (move < 0 && b.touchingWall(level, -1)) return -1;
    return 0;
  }

  _shoot(level, slidingDir) {
    if (this.char.charge && this.in.down('fire')) {
      this.charge++;
      if (this.charge === B.mid.chargeAt) playSfx('charge_mid');
      if (this.charge === B.full.chargeAt) playSfx('charge_full');
    }
    if (this.in.pressed('fire')) this._fire('lemon', slidingDir);
    if (this.in.released('fire')) {
      if (this.char.charge) {
        if (this.charge >= B.full.chargeAt) this._fire('full', slidingDir);
        else if (this.charge >= B.mid.chargeAt) this._fire('mid', slidingDir);
      }
      this.charge = 0;
    }
    if (this.shootT > 0) this.shootT--;
  }

  _fire(kind, slidingDir) {
    const live = this.shots.filter(s => s.kind === 'lemon').length;
    if (kind === 'lemon' && live >= B.maxOnScreen) return;
    const dir = slidingDir !== 0 ? -slidingDir : this.facing;
    const spec = B[kind];
    this.shots.push({
      kind, x: this.x + dir * this.char.shootX, y: this.y + this.char.shootY,
      vx: dir * spec.speed, dmg: spec.dmg, dir, age: 0,
    });
    this.fx.spawn('muzzle', this.x + dir * (this.char.shootX + 2), this.y + this.char.shootY, dir,
      { sheet: 'buster', center: true });
    playSfx(kind === 'full' ? 'full_shot' : kind === 'mid' ? 'mid_shot' : 'lemon');
    this.shootT = B.shootPose;
  }

  _updateShots(level) {
    for (const s of this.shots) { s.x += s.vx; s.age++; }
    this.shots = this.shots.filter(s => {
      if (level.solidAt(s.x, s.y)) {
        this.fx.spawn('impact_' + s.kind, s.x - s.dir * 2, s.y, s.dir, { sheet: 'buster', center: true });
        return false;
      }
      return Math.abs(s.x - this.x) < CFG.view.w * 0.75;
    });
  }

  _animate(dashing, move, slidingDir) {
    const b = this.body, a = this.anim, sh = this.shootT > 0;
    if (this.wallLock > 0) a.set('wall_kick');
    else if (slidingDir !== 0 && !b.onGround) a.set('wall_slide');
    else if (!b.onGround) a.set(b.vy < 0 ? (sh ? 'jump_shoot' : 'jump') : (sh ? 'fall_shoot' : 'fall'));
    else if (dashing) a.set(sh ? 'dash_shoot' : 'dash');
    else if (move !== 0) a.set(sh ? 'run_shoot' : 'run');
    else a.set(sh ? 'idle_shoot' : 'idle');
    a.tick();
  }

  draw(g, cam) {
    if (this.state === 'dead') return;
    if (this.iT > 0 && (this.iT % 4) < 2) return;
    if (this.char.charge && this.charge >= B.mid.chargeAt) {
      const full = this.charge >= B.full.chargeAt;
      g.save();
      g.globalAlpha = 0.35 + 0.25 * Math.sin(performance.now() / 40);
      g.strokeStyle = full ? '#7ef9ff' : '#ffd75e';
      g.lineWidth = 2;
      g.strokeRect(this.x - 12 - cam.ix, this.y - this.char.hitH - 4 - cam.iy, 24, this.char.hitH + 4);
      g.restore();
    }
    this.anim.draw(g, this.x - cam.ix, this.y - cam.iy, this.facing * this.char.flipBase);
    // Shots come from the shared buster sheet, which faces right — use the
    // shot's own direction, not the character sheet's flipBase.
    for (const s of this.shots) {
      const name = 'shot_' + s.kind;
      const def = this.shotAnim.map[name];
      const frame = Math.floor(s.age * def.fps * CFG.animSpeed / 60) % def.frames.length;
      this.shotAnim.draw(g, s.x - cam.ix, s.y - cam.iy, s.dir, name, frame,
        { center: true, scale: s.kind === 'full' ? B.full.scale : 1 });
    }
  }
}
