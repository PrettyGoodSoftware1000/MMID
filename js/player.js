import { CFG } from './config.js';
import { Body } from './body.js';
import { input } from './input.js';

const P = CFG.player, B = CFG.buster;

export class Player {
  constructor(anim, effects) {
    this.anim = anim; this.fx = effects;
    this.body = new Body(P.hitW, P.hitH);
    this.facing = 1;
    this.hp = P.hp;
    this.state = 'spawn';        // spawn|play|hurt|dead
    this.dashT = 0; this.dashHeld = false; this.dashJump = false;
    this.wallLock = 0; this.wallDir = 0;
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
    this.hp = P.hp; this.iT = 0; this.shots = [];
    this.body.vx = 0; this.body.vy = 0;
  }

  get x() { return this.body.x; }
  get y() { return this.body.y; }
  get dead() { return this.state === 'dead' && this.deadT > 70; }

  hit(dmg, fromX) {
    if (this.iT > 0 || this.state !== 'play') return;
    this.hp -= dmg;
    this.iT = P.iFrames;
    this.fx.spawn('hit_spark', this.x, this.y - 12, 1);
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
      // fall in from the sky like a teleport beam, then play materialize
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
    const L = input.down('left'), R = input.down('right');
    const move = (R ? 1 : 0) - (L ? 1 : 0);

    // dash
    const wasGround = b.onGround;
    if (input.pressed('dash') && b.onGround && this.dashT <= 0) {
      this.dashT = CFG.dashFrames; this.dashHeld = true;
      this.facing = move !== 0 ? move : this.facing;
      this.fx.spawn('dash_dust', this.x - this.facing * 10, this.y, this.facing);
    }
    if (!input.down('dash')) this.dashHeld = false;
    const dashing = this.dashT > 0 && b.onGround;
    if (this.dashT > 0) { this.dashT--; if (!this.dashHeld && this.dashT > 4) this.dashT = 4; }

    // horizontal velocity
    if (this.wallLock > 0) {
      this.wallLock--;
      b.vx = -this.wallDir * (this.dashJump ? CFG.wallKick.vxDash : CFG.wallKick.vx);
    } else if (dashing) {
      b.vx = this.facing * CFG.dashSpeed;
      if (move !== 0 && move !== this.facing) this.dashT = 0; // turn cancels dash
    } else if (move !== 0) {
      this.facing = move;
      b.vx = move * (this.dashJump && !b.onGround ? CFG.dashSpeed : CFG.runSpeed);
    } else b.vx = 0;

    // jumping: buffer + coyote for feel
    this.coyote = b.onGround ? 6 : Math.max(0, this.coyote - 1);
    this.jumpBuf = input.pressed('jump') ? 5 : Math.max(0, this.jumpBuf - 1);

    const slidingDir = this._wallSlideDir(level, move);
    if (this.jumpBuf > 0) {
      if (this.coyote > 0) {
        b.vy = CFG.jumpVel;
        this.dashJump = this.dashT > 0 || (dashing && this.dashHeld) || (input.down('dash') && Math.abs(b.vx) >= CFG.dashSpeed - 0.1);
        if (input.down('dash') && this.dashT > 0) this.dashJump = true;
        this.dashT = 0; this.coyote = 0; this.jumpBuf = 0;
      } else if (slidingDir !== 0) {
        // wall kick
        this.wallDir = slidingDir;
        this.wallLock = CFG.wallKick.lockFrames;
        b.vy = CFG.wallKick.vy;
        this.dashJump = input.down('dash');
        this.facing = -slidingDir;
        this.jumpBuf = 0;
        this.anim.set('wall_kick', true);
        this.fx.spawn('dash_dust', this.x + slidingDir * 8, this.y - 8, -slidingDir);
      }
    }
    if (input.released('jump') && b.vy < -1.5) b.vy = -1.5; // variable jump height

    // gravity / wall slide
    if (slidingDir !== 0 && b.vy > 0) {
      b.vy = Math.min(b.vy + CFG.gravity, CFG.wallSlideMaxFall);
    } else {
      b.vy = Math.min(b.vy + CFG.gravity, CFG.maxFall);
    }

    // move
    const dropThrough = input.down('down') && this.jumpBuf === 0 && input.pressed('jump');
    b.moveX(level, b.vx);
    b.moveY(level, b.vy, input.down('down') && b.vy > 0 && dropThrough);
    if (b.onGround) this.dashJump = false;

    // pit death
    if (b.top() > level.h + 8) { this.hp = 0; this.state = 'dead'; this.deadT = 0; }

    // shooting
    this._shoot(level, slidingDir);
    this._updateShots(level);

    // pick animation
    this._animate(dashing, move, slidingDir);
  }

  _wallSlideDir(level, move) {
    const b = this.body;
    if (b.onGround || move === 0) return 0;
    if (b.vy <= 0) return 0;
    if (move > 0 && b.touchingWall(level, 1)) return 1;
    if (move < 0 && b.touchingWall(level, -1)) return -1;
    return 0;
  }

  _shoot(level, slidingDir) {
    if (input.down('fire')) this.charge++;
    if (input.pressed('fire')) this._fire('lemon', slidingDir);
    if (input.released('fire')) {
      if (this.charge >= B.full.chargeAt) this._fire('full', slidingDir);
      else if (this.charge >= B.mid.chargeAt) this._fire('mid', slidingDir);
      this.charge = 0;
    }
    if (this.shootT > 0) this.shootT--;
  }

  _fire(kind, slidingDir) {
    const live = this.shots.filter(s => s.kind === 'lemon').length;
    if (kind === 'lemon' && live >= B.maxOnScreen) return;
    const dir = slidingDir !== 0 ? -slidingDir : this.facing;
    const spec = B[kind];
    const oy = -16;
    this.shots.push({ kind, x: this.x + dir * 12, y: this.y + oy, vx: dir * spec.speed, dmg: spec.dmg, dir });
    this.fx.spawn('muzzle', this.x + dir * 14, this.y + oy + 8, dir);
    this.shootT = B.shootPose;
  }

  _updateShots(level) {
    for (const s of this.shots) { s.x += s.vx; }
    this.shots = this.shots.filter(s =>
      !level.solidAt(s.x, s.y) && Math.abs(s.x - this.x) < CFG.view.w * 0.75);
  }

  _animate(dashing, move, slidingDir) {
    const b = this.body, a = this.anim, sh = this.shootT > 0;
    if (this.wallLock > 0) { a.set('wall_kick'); }
    else if (slidingDir !== 0 && !b.onGround) a.set('wall_slide');
    else if (!b.onGround) a.set(b.vy < 0 ? (sh ? 'jump_shoot' : 'jump') : (sh ? 'fall_shoot' : 'fall'));
    else if (dashing) a.set(sh ? 'dash_shoot' : 'dash');
    else if (move !== 0) a.set(sh ? 'run_shoot' : 'run');
    else a.set(sh ? 'idle_shoot' : 'idle');
    a.tick();
  }

  draw(g, cam) {
    if (this.state === 'dead') return;
    if (this.iT > 0 && (this.iT % 4) < 2) return;   // i-frame flicker
    // charge glow
    if (this.charge >= B.mid.chargeAt) {
      const full = this.charge >= B.full.chargeAt;
      g.save();
      g.globalAlpha = 0.35 + 0.25 * Math.sin(performance.now() / 40);
      g.strokeStyle = full ? '#7ef9ff' : '#ffd75e';
      g.lineWidth = 2;
      g.strokeRect(this.x - 10 - cam.ix, this.y - 32 - cam.iy, 20, 32);
      g.restore();
    }
    this.anim.draw(g, this.x - cam.ix, this.y - cam.iy, this.facing);
    // shots
    for (const s of this.shots) {
      const name = s.kind === 'full' ? 'shot_full' : s.kind === 'mid' ? 'shot_mid' : 'shot_lemon';
      this.anim.draw(g, s.x - cam.ix, s.y + 4 - cam.iy, s.dir, name, 0);
    }
  }
}
