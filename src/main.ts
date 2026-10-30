import * as THREE from 'three';
import './style.css';

const app = document.querySelector<HTMLDivElement>('#app')!;
app.innerHTML = `
<div class="hud">
  <div class="top">
    <div class="panel">
      <div class="brand">TOWER OF TRIALS</div>
      <h1>Floor I: The Forgotten Gate</h1>
      <div class="small">PLAYER · TRIAL SEEKER</div>
      <div class="bar"><div id="hp" class="fill"></div></div>
      <div id="hptext" class="small">HP 100 / 100</div>
    </div>
    <div class="panel status">
      <div id="wave">WAVE 1 / 3</div>
      <div id="kills" style="margin-top:8px">ENEMIES 0</div>
      <div id="level" style="margin-top:8px;color:#5eead4">LEVEL 1 · 0 XP</div>
    </div>
  </div>
  <div id="joystick" aria-label="Movement joystick">
    <div class="joy-label">MOVE</div>
    <div id="joy-knob"></div>
  </div>
  <div class="bottom">
    <div class="panel hint">Move: WASD / arrows<br>Attack: SPACE or ATTACK<br>Defeat enemies to open the gate.</div>
    <div class="controls">
      <button class="action" id="attack">⚔ ATTACK</button>
      <button class="action" id="dodge">DODGE</button>
    </div>
  </div>
</div>
<div id="message"></div>`;

const scene = new THREE.Scene();
scene.background = new THREE.Color('#090d18');
scene.fog = new THREE.Fog('#090d18', 22, 65);

const camera = new THREE.PerspectiveCamera(60, innerWidth / innerHeight, 0.1, 150);

function updateCameraSettings() {
  const aspect = innerWidth / innerHeight;
  const portrait = aspect < 1;

  // Responsive third-person camera framing
  camera.fov = portrait ? 62 : 52;
  camera.updateProjectionMatrix();

  cameraDistance = portrait ? 9 : 4.2;
  cameraHeight = portrait ? 4.8 : 2.8;
}

let cameraDistance = 6.5;
let cameraHeight = 3.7;
updateCameraSettings();
camera.position.set(0, 5, 9);

const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(devicePixelRatio, 1.7));
renderer.setSize(innerWidth, innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.2;
app.prepend(renderer.domElement);

scene.add(new THREE.HemisphereLight('#a9c9ff', '#171326', 2));
const sun = new THREE.DirectionalLight('#d8e5ff', 3);
sun.position.set(-8, 14, 7);
sun.castShadow = true;
sun.shadow.mapSize.set(1024, 1024);
scene.add(sun);

const ground = new THREE.Mesh(
  new THREE.PlaneGeometry(100, 100),
  new THREE.MeshStandardMaterial({ color: '#182333', roughness: 0.92 })
);
ground.rotation.x = -Math.PI / 2;
ground.receiveShadow = true;
scene.add(ground);

const grid = new THREE.GridHelper(70, 70, '#355064', '#243448');
grid.position.y = 0.015;
scene.add(grid);

function box(x:number,y:number,z:number,sx:number,sy:number,sz:number,color:string,emissive='') {
  const mat = new THREE.MeshStandardMaterial({
    color,
    roughness: 0.72,
    ...(emissive ? { emissive, emissiveIntensity: 1.2 } : {})
  });
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(sx,sy,sz),mat);
  mesh.position.set(x,y,z);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  scene.add(mesh);
  return mesh;
}

// Ruined gate and ancient stone pillars.
for (const x of [-4.5,4.5]) {
  box(x,2,-12,1.1,4,1.1,'#38465b');
  box(x,4.15,-12,1.6,.35,1.5,'#64748b');
}
box(0,4,-12,8,.5,1.1,'#64748b');
box(0,2.4,-11.9,4.8,2.8,.12,'#123c49',' #0e7490');
const portalLight = new THREE.PointLight('#22d3ee',25,18);
portalLight.position.set(0,3,-11);
scene.add(portalLight);

// Ruined walls, crystals and distant towers.
for(let i=0;i<18;i++){
  const side = i%2 ? 1 : -1;
  const z = -17 + Math.floor(i/2)*4;
  box(side*(8+Math.random()*2),1.1,z,2,2+Math.random()*2,2,
      i%3?'#29384b':'#43385d');
}
for(let i=0;i<12;i++){
  const x=(Math.random()-.5)*24;
  const z=-2-Math.random()*28;
  const crystal = new THREE.Mesh(
    new THREE.OctahedronGeometry(.35+Math.random()*.4),
    new THREE.MeshStandardMaterial({color:'#2dd4bf',emissive:'#0e7490',emissiveIntensity:2})
  );
  crystal.position.set(x,.65,z);
  crystal.rotation.set(Math.random(),Math.random(),Math.random());
  scene.add(crystal);
}

// Shadow Knight player model.
const player = new THREE.Group();
scene.add(player);

const armor = new THREE.MeshStandardMaterial({
  color: '#263449', metalness: 0.82, roughness: 0.3
});
const darkArmor = new THREE.MeshStandardMaterial({
  color: '#101827', metalness: 0.65, roughness: 0.38
});
const silver = new THREE.MeshStandardMaterial({
  color: '#a8c4d8', metalness: 0.9, roughness: 0.2
});
const glow = new THREE.MeshStandardMaterial({
  color: '#5eead4', emissive: '#0d9488',
  emissiveIntensity: 2.5, metalness: 0.4
});
const cloth = new THREE.MeshStandardMaterial({
  color: '#101a35', roughness: 0.9, side: THREE.DoubleSide
});

function knightPart(
  geometry: THREE.BufferGeometry,
  material: THREE.Material,
  position: [number, number, number],
  scale?: [number, number, number]
) {
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.set(...position);
  if (scale) mesh.scale.set(...scale);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  player.add(mesh);
  return mesh;
}

// Armored torso and chest plate.
knightPart(new THREE.CapsuleGeometry(.39, .75, 5, 12), armor, [0, 1.12, 0]);
knightPart(new THREE.BoxGeometry(.62, .55, .16), silver, [0, 1.35, -.335]);
knightPart(new THREE.BoxGeometry(.12, .48, .045), glow, [0, 1.35, -.43]);

// Neck and enclosed helmet.
knightPart(new THREE.CylinderGeometry(.16, .18, .2, 10), darkArmor, [0, 1.72, 0]);
knightPart(new THREE.SphereGeometry(.31, 12, 12), armor, [0, 2.02, 0]);
knightPart(new THREE.ConeGeometry(.12, .35, 5), silver, [0, 2.37, 0]);
knightPart(new THREE.BoxGeometry(.34, .07, .055), darkArmor, [0, 2.04, -.285]);
knightPart(new THREE.BoxGeometry(.105, .035, .035), glow, [-.09, 2.04, -.32]);
knightPart(new THREE.BoxGeometry(.105, .035, .035), glow, [.09, 2.04, -.32]);

// Shoulder armor.
for (const side of [-1, 1]) {
  const shoulder = knightPart(
    new THREE.SphereGeometry(.27, 10, 8),
    silver,
    [side * .48, 1.48, 0]
  );
  shoulder.scale.set(1.15, .72, 1);

  // Arms.
  const arm = knightPart(
    new THREE.CylinderGeometry(.105, .14, .58, 8),
    darkArmor,
    [side * .51, 1.02, 0]
  );
  arm.rotation.z = side * -.12;

  knightPart(
    new THREE.BoxGeometry(.23, .2, .22),
    armor,
    [side * .52, .69, 0]
  );

  // Legs and boots.
  knightPart(
    new THREE.CylinderGeometry(.14, .17, .55, 8),
    armor,
    [side * .21, .38, 0]
  );
  knightPart(
    new THREE.BoxGeometry(.29, .2, .43),
    darkArmor,
    [side * .21, .12, -.08]
  );
}

// Long dark cloak behind the warrior.
const cloakMesh = knightPart(
  new THREE.ConeGeometry(.56, 1.15, 7),
  cloth,
  [0, .9, .34]
);
cloakMesh.rotation.x = Math.PI;

// Glowing sword on the warrior's right side.
const sword = new THREE.Group();
sword.position.set(.68, 1.0, -.08);
sword.rotation.z = -.35;
player.add(sword);

const blade = new THREE.Mesh(
  new THREE.BoxGeometry(.13, 1.15, .055),
  new THREE.MeshStandardMaterial({
    color: '#d9faff', metalness: .95, roughness: .12,
    emissive: '#0891b2', emissiveIntensity: .75
  })
);
blade.position.y = .65;
blade.castShadow = true;
sword.add(blade);

const guard = new THREE.Mesh(
  new THREE.BoxGeometry(.42, .09, .12), silver
);
guard.position.y = .12;
sword.add(guard);

const grip = new THREE.Mesh(
  new THREE.CylinderGeometry(.055, .055, .42, 8), darkArmor
);
grip.position.y = -.13;
sword.add(grip);

const pommel = new THREE.Mesh(
  new THREE.SphereGeometry(.09, 8, 8), glow
);
pommel.position.y = -.36;
sword.add(pommel);

const enemies: {
  group: THREE.Group;
  hp: number;
  maxHp: number;
  attack: number;
  cool: number;
  dead: boolean;
  material: THREE.MeshStandardMaterial;
  hitFlash: number;
  deathTime: number;
  deathParticlesSpawned: boolean;
  fallDirection: number;
}[] = [];

const hitParticles: {
  mesh: THREE.Mesh;
  velocity: THREE.Vector3;
  life: number;
}[] = [];

const deathParticles: {
  mesh: THREE.Mesh;
  velocity: THREE.Vector3;
  life: number;
  maxLife: number;
}[] = [];
let hp=100, xp=0, kills=0, wave=1, attackCooldown=0, dodgeTime=0, invulnerable=0;
const keys = new Set<string>();
let joystickX = 0;
let joystickY = 0;
const lastMoveDir = new THREE.Vector3(0, 0, 1);
const dodgeDir = new THREE.Vector3(0, 0, 1);

const joystick = document.querySelector<HTMLDivElement>('#joystick')!;
const joyKnob = document.querySelector<HTMLDivElement>('#joy-knob')!;
let joyPointer: number | null = null;

function updateJoystick(e: PointerEvent) {
  const rect = joystick.getBoundingClientRect();
  const cx = rect.left + rect.width / 2;
  const cy = rect.top + rect.height / 2;
  const dx = e.clientX - cx;
  const dy = e.clientY - cy;
  const radius = 38;
  const length = Math.hypot(dx, dy);
  const scale = length > radius ? radius / length : 1;
  const x = dx * scale;
  const y = dy * scale;
  joystickX = x / radius;
  joystickY = y / radius;
  joyKnob.style.transform = `translate(${x}px, ${y}px)`;
}

joystick.addEventListener('pointerdown', e => {
  e.preventDefault();
  joyPointer = e.pointerId;
  joystick.setPointerCapture(e.pointerId);
  updateJoystick(e);
});
joystick.addEventListener('pointermove', e => {
  if (e.pointerId === joyPointer) {
    e.preventDefault();
    updateJoystick(e);
  }
});
function releaseJoystick(e: PointerEvent) {
  if (e.pointerId !== joyPointer) return;
  joyPointer = null;
  joystickX = 0;
  joystickY = 0;
  joyKnob.style.transform = 'translate(0px, 0px)';
}
joystick.addEventListener('pointerup', releaseJoystick);
joystick.addEventListener('pointercancel', releaseJoystick);
const hpEl=document.querySelector<HTMLDivElement>('#hp')!;
const hpText=document.querySelector<HTMLDivElement>('#hptext')!;
const waveEl=document.querySelector<HTMLDivElement>('#wave')!;
const killsEl=document.querySelector<HTMLDivElement>('#kills')!;
const levelEl=document.querySelector<HTMLDivElement>('#level')!;
const message=document.querySelector<HTMLDivElement>('#message')!;
let messageTimer=0;
function say(s:string){message.textContent=s;message.style.opacity='1';messageTimer=1.8}
function updateHud(){
  hpEl.style.width=`${Math.max(0,hp)}%`;
  hpText.textContent=`HP ${Math.max(0,Math.ceil(hp))} / 100`;
  waveEl.textContent=wave<=3?`WAVE ${wave} / 3`:'GATE OPEN';
  killsEl.textContent=`ENEMIES ${enemies.filter(e=>!e.dead).length}`;
  levelEl.textContent=`LEVEL ${1+Math.floor(xp/100)} · ${xp} XP`;
}
function spawnEnemy(x:number,z:number,boss=false){
  const g=new THREE.Group();g.position.set(x,0,z);scene.add(g);
  const material=new THREE.MeshStandardMaterial({
    color:boss?'#991b1b':'#7f1d1d',roughness:.55,
    emissive:boss?'#7f1d1d':'#450a0a',emissiveIntensity:.8
  });
  const torso=new THREE.Mesh(new THREE.BoxGeometry(boss?1.1:.7,boss?1.5:1,.55),material);
  torso.position.y=boss?1.15:.8;torso.castShadow=true;g.add(torso);
  const h=new THREE.Mesh(new THREE.SphereGeometry(boss?.42:.28,10,8),
    new THREE.MeshStandardMaterial({color:'#fda4af',emissive:'#be123c',emissiveIntensity:.7}));
  h.position.y=boss?2.2:1.55;g.add(h);
  const eyeLight=new THREE.PointLight('#fb7185',boss?3:1.3,4);
  eyeLight.position.y=1.6;g.add(eyeLight);
  enemies.push({
    group: g, hp: boss ? 12 : 3, maxHp: boss ? 12 : 3,
    attack: boss ? 18 : 7, cool: 1, dead: false,
    material,
    hitFlash: 0,
    deathTime: 0,
    deathParticlesSpawned: false,
    fallDirection: Math.random() < .5 ? -1 : 1
  });
}
function spawnWave(){
  if(wave===1){for(let i=0;i<4;i++)spawnEnemy((i-1.5)*3,-6-Math.random()*5)}
  else if(wave===2){for(let i=0;i<5;i++)spawnEnemy((i-2)*2.7,-8-Math.random()*5)}
  else if(wave===3){spawnEnemy(0,-10,true);for(let i=0;i<2;i++)spawnEnemy(i?4:-4,-8)}
  else {say('THE GATE IS OPEN');return}
  say(wave===3?'THE FLOOR GUARDIAN AWAKENS':`WAVE ${wave} — ENEMIES APPROACH`);
  updateHud();
}
spawnWave();

let attackAnimTime = 0;

function spawnHitParticles(position: THREE.Vector3) {
  for (let i = 0; i < 5; i++) {
    const mesh = new THREE.Mesh(
      new THREE.SphereGeometry(.065, 6, 6),
      new THREE.MeshBasicMaterial({ color: '#5eead4', transparent: true })
    );
    mesh.position.copy(position);
    mesh.position.y += 1.2 + Math.random() * .5;
    scene.add(mesh);

    hitParticles.push({
      mesh,
      velocity: new THREE.Vector3(
        (Math.random() - .5) * 4,
        Math.random() * 3,
        (Math.random() - .5) * 4
      ),
      life: .38
    });
  }
}

function spawnDeathEffect(position: THREE.Vector3) {
  for (let i = 0; i < 28; i++) {
    const material = new THREE.MeshBasicMaterial({
      color: i % 3 === 0 ? 0xd8b4fe : 0x6d28d9,
      transparent: true,
      opacity: .95,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    const mesh = new THREE.Mesh(
      new THREE.IcosahedronGeometry(.055 + Math.random() * .095, 0),
      material
    );

    mesh.position.copy(position);
    mesh.position.y += Math.random() * .85;
    scene.add(mesh);

    const angle = Math.random() * Math.PI * 2;
    const speed = 1.5 + Math.random() * 3;

    deathParticles.push({
      mesh,
      velocity: new THREE.Vector3(
        Math.cos(angle) * speed,
        .8 + Math.random() * 2.5,
        Math.sin(angle) * speed
      ),
      life: .75,
      maxLife: .75
    });
  }
}

function attack(){
  if(attackCooldown>0||hp<=0)return;
  attackCooldown=.42;
  attackAnimTime = .32;
  let hit=false;
  for(const e of enemies){
    if(e.dead)continue;
    const dx=e.group.position.x-player.position.x;
    const dz=e.group.position.z-player.position.z;
    if(Math.hypot(dx,dz)<2.7){
      e.hp-=1;
      e.hitFlash = .18;
      e.material.emissiveIntensity = 2.8;
      spawnHitParticles(e.group.position);
      e.group.position.x+=Math.sign(dx||1)*.45;
      hit=true;
      if(e.hp<=0){
        e.dead=true;
        e.deathTime=0;
        e.deathParticlesSpawned=false;
        kills++;
        xp+=e.maxHp===12?60:25;
      }
    }
  }
  if(hit){
    say('HIT!');
    if(enemies.every(e=>e.dead)){
      wave++;
      if(wave<=3)setTimeout(spawnWave,900);
      else say('VICTORY — FLOOR I CLEARED');
    }
  }
  updateHud();
}
function dodge(){
  if(dodgeTime>0||hp<=0)return;
  dodgeTime=.28;invulnerable=.45;
  dodgeDir.copy(lastMoveDir);
  say('DODGE');
}
document.querySelector('#attack')!.addEventListener('pointerdown',e=>{e.preventDefault();attack()});
document.querySelector('#dodge')!.addEventListener('pointerdown',e=>{e.preventDefault();dodge()});
addEventListener('keydown',e=>{
  keys.add(e.key.toLowerCase());
  if(e.code==='Space'){e.preventDefault();attack()}
  if(e.key.toLowerCase()==='shift')dodge();
});
addEventListener('keyup',e=>keys.delete(e.key.toLowerCase()));
addEventListener('blur',()=>keys.clear());

const clock=new THREE.Clock();
const targetCamera=new THREE.Vector3();

let cameraYaw = 0;
let cameraPointer: number | null = null;
let lastPointerX = 0;

// Drag the right side of the game to rotate the camera.
renderer.domElement.addEventListener('pointerdown', e => {
  if (e.clientX < innerWidth * 0.45) return;
  cameraPointer = e.pointerId;
  lastPointerX = e.clientX;
  renderer.domElement.setPointerCapture(e.pointerId);
});

renderer.domElement.addEventListener('pointermove', e => {
  if (e.pointerId !== cameraPointer) return;

  const deltaX = e.clientX - lastPointerX;
  lastPointerX = e.clientX;
  cameraYaw -= deltaX * 0.006;
});

function releaseCameraPointer(e: PointerEvent) {
  if (e.pointerId === cameraPointer) cameraPointer = null;
}

renderer.domElement.addEventListener('pointerup', releaseCameraPointer);
renderer.domElement.addEventListener('pointercancel', releaseCameraPointer);

let lastHud=0;
function animate(){
  requestAnimationFrame(animate);
  const dt=Math.min(clock.getDelta(),.04);
  attackCooldown=Math.max(0,attackCooldown-dt);
  attackAnimTime=Math.max(0,attackAnimTime-dt);

  if (attackAnimTime > 0) {
    const progress = 1 - attackAnimTime / .32;
    sword.rotation.z = -.35 - Math.sin(progress * Math.PI) * 1.55;
  } else {
    sword.rotation.z = -.35;
  }

  dodgeTime=Math.max(0,dodgeTime-dt);
  invulnerable=Math.max(0,invulnerable-dt);
  if(messageTimer>0){messageTimer-=dt;if(messageTimer<=0)message.style.opacity='0'}
  if(hp>0){
    const rightInput =
      Number(keys.has('d')||keys.has('arrowright')) -
      Number(keys.has('a')||keys.has('arrowleft')) + joystickX;

    const forwardInput =
      Number(keys.has('w')||keys.has('arrowup')) -
      Number(keys.has('s')||keys.has('arrowdown')) - joystickY;

    const dir = new THREE.Vector3(
      rightInput * Math.cos(cameraYaw) - forwardInput * Math.sin(cameraYaw),
      0,
      -rightInput * Math.sin(cameraYaw) - forwardInput * Math.cos(cameraYaw)
    );
    if(dir.lengthSq()>1) dir.normalize();
    if(dir.lengthSq()>0.01){
      dir.normalize();
      lastMoveDir.copy(dir);
      const speed=5;
      player.position.addScaledVector(dir,speed*dt);
      player.position.x=THREE.MathUtils.clamp(player.position.x,-13,13);
      player.position.z=THREE.MathUtils.clamp(player.position.z,-16,5);
      player.rotation.y=Math.atan2(dir.x,dir.z)+Math.PI;
    }
    if(dodgeTime>0) {
      player.position.addScaledVector(dodgeDir, 8*dt);
      player.position.x=THREE.MathUtils.clamp(player.position.x,-13,13);
      player.position.z=THREE.MathUtils.clamp(player.position.z,-16,5);
    }
    const activeEnemies = enemies.filter(e => !e.dead);

    activeEnemies.forEach((e, index) => {
      const isBoss = e.maxHp === 12;

      // Give each enemy its own position around the player.
      const angle =
        -Math.PI / 2 + (index / activeEnemies.length) * Math.PI * 2;

      const desiredRadius = isBoss ? 1.4 : 1.8;

      const targetX =
        player.position.x + Math.cos(angle) * desiredRadius;
      const targetZ =
        player.position.z + Math.sin(angle) * desiredRadius;

      let moveX = targetX - e.group.position.x;
      let moveZ = targetZ - e.group.position.z;

      // Push enemies apart so they do not overlap.
      for (const other of activeEnemies) {
        if (other === e) continue;

        const awayX = e.group.position.x - other.group.position.x;
        const awayZ = e.group.position.z - other.group.position.z;
        const separation = Math.hypot(awayX, awayZ);

        if (separation > 0 && separation < 1.15) {
          const push = (1.15 - separation) / 1.15;
          moveX += (awayX / separation) * push * 1.8;
          moveZ += (awayZ / separation) * push * 1.8;
        }
      }

      // Move toward the assigned surrounding position.
      const moveLength = Math.hypot(moveX, moveZ);

      if (moveLength > .18) {
        const speed = isBoss ? 1.55 : 1.9;
        e.group.position.x += (moveX / moveLength) * speed * dt;
        e.group.position.z += (moveZ / moveLength) * speed * dt;
      }

      // Always face the player.
      const dx = player.position.x - e.group.position.x;
      const dz = player.position.z - e.group.position.z;
      const playerDistance = Math.hypot(dx, dz);

      e.group.rotation.y = Math.atan2(dx, dz);

      // Attack when close enough.
      const attackRange = isBoss ? 1.85 : 2.05;

      if (playerDistance < attackRange) {
        e.cool -= dt;

        if (e.cool <= 0) {
          e.cool = isBoss ? 1.1 : 1.35;

          if (invulnerable <= 0) {
            hp = Math.max(0, hp - e.attack);
            say(hp === 0 ? 'YOU HAVE FALLEN' : 'YOU TOOK DAMAGE');
            updateHud();
          }
        }
      }
    });
  }
  for (const e of enemies) {
    if (e.dead) {
      e.deathTime += dt;

      // Stage 1: smoothly fall sideways onto the ground.
      const fallProgress = Math.min(1, e.deathTime / .45);
      const fallEase =
        fallProgress * fallProgress * (3 - 2 * fallProgress);

      e.group.rotation.z =
        e.fallDirection * fallEase * (Math.PI / 2);

      e.group.position.y =
        (e.maxHp === 12 ? .8 : .4) * fallEase;

      // Stage 2: release fragments after the body has landed.
      if (fallProgress >= 1 && !e.deathParticlesSpawned) {
        e.deathParticlesSpawned = true;
        spawnDeathEffect(e.group.position);
      }

      if (e.deathParticlesSpawned) {
        const dissolveProgress = Math.min(
          1,
          (e.deathTime - .45) / .55
        );

        e.group.scale.setScalar(
          Math.max(.001, 1 - dissolveProgress)
        );

        if (dissolveProgress >= 1) {
          scene.remove(e.group);
        }
      }

      continue;
    }

    if (e.hitFlash > 0) {
      e.hitFlash = Math.max(0, e.hitFlash - dt);
      if (e.hitFlash === 0) e.material.emissiveIntensity = .8;
    }
  }

  for (let i = deathParticles.length - 1; i >= 0; i--) {
    const particle = deathParticles[i];
    particle.life -= dt;
    particle.mesh.position.addScaledVector(particle.velocity, dt);
    particle.velocity.y -= 2.5 * dt;
    particle.velocity.multiplyScalar(Math.max(0, 1 - dt * 1.5));

    const material = particle.mesh.material as THREE.MeshBasicMaterial;
    material.opacity = Math.max(0, particle.life / particle.maxLife);
    particle.mesh.scale.setScalar(Math.max(.05, particle.life / particle.maxLife));

    if (particle.life <= 0) {
      scene.remove(particle.mesh);
      particle.mesh.geometry.dispose();
      material.dispose();
      deathParticles.splice(i, 1);
    }
  }

  for (let i = hitParticles.length - 1; i >= 0; i--) {
    const particle = hitParticles[i];
    particle.life -= dt;
    particle.mesh.position.addScaledVector(particle.velocity, dt);
    particle.velocity.y -= 7 * dt;

    const material = particle.mesh.material as THREE.MeshBasicMaterial;
    material.opacity = Math.max(0, particle.life / .38);

    if (particle.life <= 0) {
      scene.remove(particle.mesh);
      particle.mesh.geometry.dispose();
      material.dispose();
      hitParticles.splice(i, 1);
    }
  }

  targetCamera.set(
    player.position.x + Math.sin(cameraYaw) * cameraDistance,
    player.position.y + cameraHeight,
    player.position.z + Math.cos(cameraYaw) * cameraDistance
  );

  camera.position.lerp(targetCamera,.12);

  camera.lookAt(
    player.position.x - Math.sin(cameraYaw) * 2.5,
    player.position.y + 1,
    player.position.z - Math.cos(cameraYaw) * 2.5
  );
  portalLight.intensity=22+Math.sin(performance.now()*.003)*6;
  renderer.render(scene,camera);
  if(performance.now()-lastHud>250){updateHud();lastHud=performance.now()}
}
addEventListener('resize',()=>{
  camera.aspect=innerWidth/innerHeight;
  updateCameraSettings();
  renderer.setSize(innerWidth,innerHeight);
});
updateHud();
animate();
