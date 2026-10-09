/**
 * AI BUS TRACK - REAL VOLVO BUS 3D LIVE TRACKING SYSTEM
 * Core Three.js Engine:
 * - High-Fidelity Procedural 3D Volvo 9600 Luxury Multi-Axle Coach
 * - Continuous Spline Highway Road & Environment (Asphalt, Lanes, Streetlights, Trees, Gantry)
 * - 10 Real-Time Camera Angle Presets & Smooth OrbitControls
 * - Wheel Rotation, Chassis Suspension Micro-Vibration & Front Axle Steering
 * - Live GPS Telemetry Polling & Demo Mode Highway Simulation
 * - Day / Sunset / Night Highway Lighting with Dynamic Headlight Beams
 */

(() => {
  'use strict';

  // ---------------------------------------------------------------------------
  // 1. WEBGL COMPATIBILITY CHECK
  // ---------------------------------------------------------------------------
  function isWebGLAvailable() {
    try {
      const canvas = document.createElement('canvas');
      return !!(window.WebGLRenderingContext && (canvas.getContext('webgl') || canvas.getContext('experimental-webgl')));
    } catch (_) {
      return false;
    }
  }

  // ---------------------------------------------------------------------------
  // 2. PROCEDURAL TEXTURE GENERATORS
  // ---------------------------------------------------------------------------
  function createGrilleTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');

    // Dark metallic mesh background
    ctx.fillStyle = '#0a0d14';
    ctx.fillRect(0, 0, 512, 256);

    // Honeycomb / mesh pattern
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 2;
    for (let x = 0; x < 512; x += 12) {
      for (let y = 0; y < 256; y += 12) {
        ctx.strokeRect(x, y, 10, 10);
      }
    }

    // Volvo signature chrome diagonal slash bar
    ctx.save();
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 14;
    ctx.beginPath();
    ctx.moveTo(80, 220);
    ctx.lineTo(430, 36);
    ctx.stroke();

    // Chrome highlight on slash
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(85, 218);
    ctx.lineTo(425, 38);
    ctx.stroke();
    ctx.restore();

    // Center Volvo Iron Mark badge (circular chrome emblem)
    ctx.fillStyle = '#cbd5e1';
    ctx.beginPath();
    ctx.arc(256, 128, 38, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.arc(256, 128, 30, 0, Math.PI * 2);
    ctx.fill();

    // Blue Volvo horizontal badge bar
    ctx.fillStyle = '#0369a1';
    ctx.fillRect(216, 116, 80, 24);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 15px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('VOLVO', 256, 128);

    const texture = new THREE.CanvasTexture(canvas);
    texture.anisotropy = 4;
    return texture;
  }

  function createDestinationBoardTexture(text = 'AI BUS TRACK • VOLVO 9600 EXPRESS') {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');

    // Black LED matrix enclosure
    ctx.fillStyle = '#050505';
    ctx.fillRect(0, 0, 1024, 128);

    // Amber LED dot text
    ctx.fillStyle = '#f59e0b';
    ctx.shadowColor = '#fbbf24';
    ctx.shadowBlur = 12;
    ctx.font = '900 48px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, 512, 64);

    const texture = new THREE.CanvasTexture(canvas);
    return texture;
  }

  function createLicensePlateTexture(number = 'UP32 AB 1234') {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');

    // White reflective plate
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(0, 0, 256, 64);

    // Border
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 3;
    ctx.strokeRect(2, 2, 252, 60);

    // Blue IND strip on left
    ctx.fillStyle = '#0284c7';
    ctx.fillRect(4, 4, 28, 56);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 11px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('IND', 18, 44);

    // License Plate Text
    ctx.fillStyle = '#0f172a';
    ctx.font = '900 24px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(number, 146, 32);

    return new THREE.CanvasTexture(canvas);
  }

  function createRoadTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 1024;
    const ctx = canvas.getContext('2d');

    // Asphalt surface
    ctx.fillStyle = '#1e232a';
    ctx.fillRect(0, 0, 512, 1024);

    // Asphalt noise / aggregate texture
    for (let i = 0; i < 4000; i++) {
      const x = Math.random() * 512;
      const y = Math.random() * 1024;
      ctx.fillStyle = Math.random() > 0.5 ? '#2d333b' : '#14181d';
      ctx.fillRect(x, y, 2, 2);
    }

    // Yellow double center line
    ctx.fillStyle = '#eab308';
    ctx.fillRect(250, 0, 4, 1024);
    ctx.fillRect(258, 0, 4, 1024);

    // White dashed lane markers
    ctx.fillStyle = '#f8fafc';
    const dashLength = 64;
    const gapLength = 64;
    for (let y = 0; y < 1024; y += dashLength + gapLength) {
      ctx.fillRect(124, y, 5, dashLength);
      ctx.fillRect(384, y, 5, dashLength);
    }

    // Outer solid white shoulder lines
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(20, 0, 6, 1024);
    ctx.fillRect(486, 0, 6, 1024);

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(1, 40);
    return texture;
  }

  // ---------------------------------------------------------------------------
  // 3. VOLVO 9600 MULTI-AXLE LUXURY COACH 3D MODEL BUILDER
  // ---------------------------------------------------------------------------
  function buildVolvo9600Coach() {
    const bus = new THREE.Group();
    bus.name = 'Volvo9600Coach';

    // Length: 14.2m, Width: 2.6m, Height: 3.4m
    const L = 14.2, W = 2.6, H = 3.3;

    // --- MATERIALS (Photorealistic PBR) ---
    const rubyPaintMat = new THREE.MeshStandardMaterial({
      color: 0x9e1b2f, // Metallic Ruby Crimson (Volvo Luxury Fleet)
      roughness: 0.22,
      metalness: 0.65
    });

    const whiteAccentMat = new THREE.MeshStandardMaterial({
      color: 0xf8fafc,
      roughness: 0.28,
      metalness: 0.2
    });

    const darkTrimMat = new THREE.MeshStandardMaterial({
      color: 0x111827,
      roughness: 0.7,
      metalness: 0.2
    });

    const chromeMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.05,
      metalness: 0.95
    });

    const glassMat = new THREE.MeshStandardMaterial({
      color: 0x090d16,
      roughness: 0.08,
      metalness: 0.92,
      transparent: true,
      opacity: 0.68
    });

    const tireRubberMat = new THREE.MeshStandardMaterial({
      color: 0x18181b,
      roughness: 0.85,
      metalness: 0.05
    });

    const alloyRimMat = new THREE.MeshStandardMaterial({
      color: 0xe2e8f0,
      roughness: 0.15,
      metalness: 0.88
    });

    const headlightMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.05,
      metalness: 0.1,
      emissive: 0xffffff,
      emissiveIntensity: 0.95
    });

    const taillightMat = new THREE.MeshStandardMaterial({
      color: 0xff0020,
      roughness: 0.1,
      metalness: 0.1,
      emissive: 0xd90429,
      emissiveIntensity: 0.85
    });

    // --- 1. CHASSIS MAIN BODY ---
    // Lower body box
    const lowerBodyGeo = new THREE.BoxGeometry(W, 1.2, L);
    const lowerBody = new THREE.Mesh(lowerBodyGeo, rubyPaintMat);
    lowerBody.position.y = 1.1;
    lowerBody.castShadow = true;
    lowerBody.receiveShadow = true;
    bus.add(lowerBody);

    // Upper cabin structure
    const upperCabinGeo = new THREE.BoxGeometry(W * 0.98, 1.6, L * 0.99);
    const upperCabin = new THREE.Mesh(upperCabinGeo, rubyPaintMat);
    upperCabin.position.y = 2.45;
    upperCabin.castShadow = true;
    bus.add(upperCabin);

    // Aerodynamic curved roof cap
    const roofCurveGeo = new THREE.CylinderGeometry(W * 0.49, W * 0.49, L * 0.98, 16, 1, false, 0, Math.PI);
    const roofCurve = new THREE.Mesh(roofCurveGeo, whiteAccentMat);
    roofCurve.rotation.z = Math.PI / 2;
    roofCurve.rotation.y = Math.PI / 2;
    roofCurve.position.y = 3.25;
    roofCurve.castShadow = true;
    bus.add(roofCurve);

    // Aerodynamic rooftop twin HVAC units
    const hvacGeo = new THREE.BoxGeometry(1.6, 0.32, 2.8);
    const hvac1 = new THREE.Mesh(hvacGeo, whiteAccentMat);
    hvac1.position.set(0, 3.42, 1.2);
    hvac1.castShadow = true;
    bus.add(hvac1);

    const hvac2 = new THREE.Mesh(hvacGeo, whiteAccentMat);
    hvac2.position.set(0, 3.42, -2.5);
    hvac2.castShadow = true;
    bus.add(hvac2);

    // --- 2. SIGNATURE VOLVO FRONT MASK & GRILLE ---
    const frontMaskGeo = new THREE.BoxGeometry(W * 0.96, 1.4, 0.4);
    const frontMask = new THREE.Mesh(frontMaskGeo, darkTrimMat);
    frontMask.position.set(0, 1.15, L / 2 + 0.15);
    frontMask.rotation.x = -0.06;
    bus.add(frontMask);

    // Volvo Grille with Diagonal Chrome Slash
    const grilleGeo = new THREE.PlaneGeometry(1.5, 0.75);
    const grilleMat = new THREE.MeshStandardMaterial({
      map: createGrilleTexture(),
      roughness: 0.3,
      metalness: 0.7
    });
    const grilleMesh = new THREE.Mesh(grilleGeo, grilleMat);
    grilleMesh.position.set(0, 1.15, L / 2 + 0.36);
    bus.add(grilleMesh);

    // Front Bumper with Fog Lamps & Tow Hook Recess
    const bumperGeo = new THREE.BoxGeometry(W * 1.02, 0.48, 0.45);
    const bumper = new THREE.Mesh(bumperGeo, darkTrimMat);
    bumper.position.set(0, 0.52, L / 2 + 0.2);
    bumper.castShadow = true;
    bus.add(bumper);

    // Front License Plate
    const frontPlateGeo = new THREE.PlaneGeometry(0.72, 0.18);
    const frontPlateMat = new THREE.MeshBasicMaterial({ map: createLicensePlateTexture('UP32 AB 1234') });
    const frontPlate = new THREE.Mesh(frontPlateGeo, frontPlateMat);
    frontPlate.position.set(0, 0.52, L / 2 + 0.44);
    bus.add(frontPlate);

    // Rear License Plate
    const rearPlate = new THREE.Mesh(frontPlateGeo, frontPlateMat);
    rearPlate.position.set(0, 0.75, -L / 2 - 0.05);
    rearPlate.rotation.y = Math.PI;
    bus.add(rearPlate);

    // --- 3. PANORAMIC WINDSHIELD & DESTINATION BOARD ---
    // Double-curved front panoramic windshield
    const windshieldGeo = new THREE.PlaneGeometry(W * 0.94, 1.55);
    const windshield = new THREE.Mesh(windshieldGeo, glassMat);
    windshield.position.set(0, 2.45, L / 2 + 0.08);
    windshield.rotation.x = -0.12; // Raked aerodynamic angle
    bus.add(windshield);

    // Wiper blades
    const wiperMat = new THREE.MeshStandardMaterial({ color: 0x111827 });
    const wiperGeo = new THREE.BoxGeometry(0.04, 0.65, 0.03);
    const wiperLeft = new THREE.Mesh(wiperGeo, wiperMat);
    wiperLeft.position.set(-0.45, 1.95, L / 2 + 0.18);
    wiperLeft.rotation.z = 0.35;
    bus.add(wiperLeft);

    const wiperRight = new THREE.Mesh(wiperGeo, wiperMat);
    wiperRight.position.set(0.45, 1.95, L / 2 + 0.18);
    wiperRight.rotation.z = -0.35;
    bus.add(wiperRight);

    // LED Destination Display (Matrix Screen above windshield)
    const destBoardGeo = new THREE.PlaneGeometry(1.8, 0.25);
    const destBoardMat = new THREE.MeshBasicMaterial({
      map: createDestinationBoardTexture('AI BUS TRACK • VOLVO 9600 EXPRESS'),
      color: 0xffffff
    });
    const destBoard = new THREE.Mesh(destBoardGeo, destBoardMat);
    destBoard.position.set(0, 3.08, L / 2 + 0.05);
    destBoard.rotation.x = -0.08;
    bus.add(destBoard);

    // --- 4. FLUSH PASSENGER SIDE WINDOWS & INTERIOR CABIN ---
    // Left & Right continuous window bands
    const sideWindowGeo = new THREE.PlaneGeometry(L * 0.92, 1.35);
    
    // Left side windows
    const leftWindows = new THREE.Mesh(sideWindowGeo, glassMat);
    leftWindows.position.set(-W / 2 - 0.02, 2.45, 0);
    leftWindows.rotation.y = -Math.PI / 2;
    bus.add(leftWindows);

    // Right side windows
    const rightWindows = new THREE.Mesh(sideWindowGeo, glassMat);
    rightWindows.position.set(W / 2 + 0.02, 2.45, 0);
    rightWindows.rotation.y = Math.PI / 2;
    bus.add(rightWindows);

    // Rear window
    const rearWindowGeo = new THREE.PlaneGeometry(W * 0.85, 1.1);
    const rearWindow = new THREE.Mesh(rearWindowGeo, glassMat);
    rearWindow.position.set(0, 2.5, -L / 2 - 0.02);
    rearWindow.rotation.y = Math.PI;
    bus.add(rearWindow);

    // Interior Visible Cabin: Floor deck & 2+2 pushback reclining seats
    const cabinFloorGeo = new THREE.BoxGeometry(W * 0.85, 0.08, L * 0.85);
    const cabinFloor = new THREE.Mesh(cabinFloorGeo, darkTrimMat);
    cabinFloor.position.set(0, 1.72, 0);
    bus.add(cabinFloor);

    // Visible seat rows inside
    const seatMat = new THREE.MeshStandardMaterial({ color: 0x1e3a8a, roughness: 0.6 });
    const headrestMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.3 });
    const seatGeo = new THREE.BoxGeometry(0.48, 0.55, 0.35);
    const headrestGeo = new THREE.BoxGeometry(0.35, 0.16, 0.18);

    for (let z = -5.0; z <= 4.0; z += 1.05) {
      [-0.82, -0.32, 0.32, 0.82].forEach(x => {
        const seat = new THREE.Mesh(seatGeo, seatMat);
        seat.position.set(x, 2.05, z);
        bus.add(seat);

        const headrest = new THREE.Mesh(headrestGeo, headrestMat);
        headrest.position.set(x, 2.4, z - 0.06);
        bus.add(headrest);
      });
    }

    // Driver's steering wheel & dashboard
    const dashGeo = new THREE.BoxGeometry(0.85, 0.65, 0.6);
    const dashboard = new THREE.Mesh(dashGeo, darkTrimMat);
    dashboard.position.set(-0.65, 2.05, 5.8);
    bus.add(dashboard);

    const wheelRimGeo = new THREE.TorusGeometry(0.2, 0.035, 8, 16);
    const steeringWheel = new THREE.Mesh(wheelRimGeo, darkTrimMat);
    steeringWheel.position.set(-0.65, 2.3, 5.55);
    steeringWheel.rotation.x = 0.6;
    bus.add(steeringWheel);

    // --- 5. HEADLIGHTS & TAILLIGHTS (With Dynamic Beams) ---
    // Volvo signature V-shape LED Projector Clusters
    const headlampGeo = new THREE.BoxGeometry(0.38, 0.22, 0.12);
    const leftHeadlamp = new THREE.Mesh(headlampGeo, headlightMat);
    leftHeadlamp.position.set(-0.95, 0.95, L / 2 + 0.32);
    bus.add(leftHeadlamp);

    const rightHeadlamp = new THREE.Mesh(headlampGeo, headlightMat);
    rightHeadlamp.position.set(0.95, 0.95, L / 2 + 0.32);
    bus.add(rightHeadlamp);

    // Real dynamic SpotLight beams casting on road
    const leftBeam = new THREE.SpotLight(0xfffbeb, 2.8, 65, Math.PI / 7, 0.45, 1.2);
    leftBeam.position.set(-0.95, 0.95, L / 2 + 0.35);
    const leftBeamTarget = new THREE.Object3D();
    leftBeamTarget.position.set(-0.95, 0, L / 2 + 35);
    bus.add(leftBeam);
    bus.add(leftBeamTarget);
    leftBeam.target = leftBeamTarget;

    const rightBeam = new THREE.SpotLight(0xfffbeb, 2.8, 65, Math.PI / 7, 0.45, 1.2);
    rightBeam.position.set(0.95, 0.95, L / 2 + 0.35);
    const rightBeamTarget = new THREE.Object3D();
    rightBeamTarget.position.set(0.95, 0, L / 2 + 35);
    bus.add(rightBeam);
    bus.add(rightBeamTarget);
    rightBeam.target = rightBeamTarget;

    bus.headlightBeams = [leftBeam, rightBeam];

    // Rear Tall Vertical LED Taillights
    const tailLampGeo = new THREE.BoxGeometry(0.12, 1.15, 0.1);
    const leftTaillamp = new THREE.Mesh(tailLampGeo, taillightMat);
    leftTaillamp.position.set(-W / 2 + 0.12, 1.8, -L / 2 - 0.02);
    bus.add(leftTaillamp);

    const rightTaillamp = new THREE.Mesh(tailLampGeo, taillightMat);
    rightTaillamp.position.set(W / 2 - 0.12, 1.8, -L / 2 - 0.02);
    bus.add(rightTaillamp);

    // Rear Red Ambient Glow PointLight
    const rearGlow = new THREE.PointLight(0xef4444, 1.4, 15);
    rearGlow.position.set(0, 1.5, -L / 2 - 1.2);
    bus.add(rearGlow);
    bus.rearGlow = rearGlow;

    // --- 6. AERODYNAMIC SIDE MIRRORS & LUGGAGE HATCHES ---
    // Rabbit-ear curved side mirrors
    function createMirror(isLeft) {
      const mirrorGroup = new THREE.Group();
      const armGeo = new THREE.CylinderGeometry(0.025, 0.025, 0.85);
      const arm = new THREE.Mesh(armGeo, darkTrimMat);
      arm.rotation.z = isLeft ? -0.45 : 0.45;
      arm.rotation.y = isLeft ? 0.2 : -0.2;
      mirrorGroup.add(arm);

      const mirrorHousingGeo = new THREE.BoxGeometry(0.16, 0.52, 0.22);
      const housing = new THREE.Mesh(mirrorHousingGeo, darkTrimMat);
      housing.position.set(isLeft ? -0.42 : 0.42, 0.38, 0.18);
      mirrorGroup.add(housing);

      const mirrorFaceGeo = new THREE.PlaneGeometry(0.14, 0.48);
      const mirrorFace = new THREE.Mesh(mirrorFaceGeo, chromeMat);
      mirrorFace.position.set(isLeft ? -0.42 : 0.42, 0.38, 0.06);
      mirrorFace.rotation.y = Math.PI;
      mirrorGroup.add(mirrorFace);

      return mirrorGroup;
    }

    const leftMirror = createMirror(true);
    leftMirror.position.set(-W / 2, 2.7, L / 2 - 0.4);
    bus.add(leftMirror);

    const rightMirror = createMirror(false);
    rightMirror.position.set(W / 2, 2.7, L / 2 - 0.4);
    bus.add(rightMirror);

    // Lower Undercarriage Luggage Bay Hatches (15 KG Free Allowance Compartments)
    const hatchBorderMat = new THREE.MeshStandardMaterial({ color: 0x7f1d1d, metalness: 0.5 });
    for (let side = -1; side <= 1; side += 2) {
      for (let z = -2.0; z <= 2.5; z += 1.6) {
        const hatchGeo = new THREE.PlaneGeometry(1.35, 0.65);
        const hatch = new THREE.Mesh(hatchGeo, hatchBorderMat);
        hatch.position.set(side * (W / 2 + 0.015), 0.95, z);
        hatch.rotation.y = side === -1 ? -Math.PI / 2 : Math.PI / 2;
        bus.add(hatch);

        // Chrome hatch handle
        const handleGeo = new THREE.BoxGeometry(0.12, 0.03, 0.02);
        const handle = new THREE.Mesh(handleGeo, chromeMat);
        handle.position.set(side * (W / 2 + 0.025), 1.15, z);
        bus.add(handle);
      }
    }

    // --- 7. WHEEL ASSEMBLIES (6 WHEELS - MULTI-AXLE VOLVO 9600) ---
    // 1 Front Steer Axle (2 wheels), 1 Drive Axle (2 wheels), 1 Tag Axle (2 wheels)
    const wheelMeshes = [];
    const frontSteerGroup = new THREE.Group();
    frontSteerGroup.position.set(0, 0.52, 4.4); // Front axle Z position
    bus.add(frontSteerGroup);

    function createWheel(isLeft) {
      const wheelGroup = new THREE.Group();

      // Tire rubber (Cylinder rotated on Z-axis)
      const tireGeo = new THREE.CylinderGeometry(0.52, 0.52, 0.32, 24);
      const tire = new THREE.Mesh(tireGeo, tireRubberMat);
      tire.rotation.z = Math.PI / 2;
      tire.castShadow = true;
      wheelGroup.add(tire);

      // Alloy rim (Metallic wheel face)
      const rimGeo = new THREE.CylinderGeometry(0.36, 0.36, 0.33, 16);
      const rim = new THREE.Mesh(rimGeo, alloyRimMat);
      rim.rotation.z = Math.PI / 2;
      wheelGroup.add(rim);

      // Center Chrome Hub Cap with Lug Nuts
      const hubGeo = new THREE.CylinderGeometry(0.14, 0.14, 0.35, 12);
      const hub = new THREE.Mesh(hubGeo, chromeMat);
      hub.rotation.z = Math.PI / 2;
      wheelGroup.add(hub);

      // Multi-spoke details
      for (let s = 0; s < 5; s++) {
        const spokeGeo = new THREE.BoxGeometry(0.32, 0.04, 0.06);
        const spoke = new THREE.Mesh(spokeGeo, alloyRimMat);
        spoke.position.x = isLeft ? -0.16 : 0.16;
        spoke.rotation.x = (s * Math.PI) / 5;
        wheelGroup.add(spoke);
      }

      return wheelGroup;
    }

    // Front Steer Axle Wheels (attached to steerable group)
    const frontLeftWheel = createWheel(true);
    frontLeftWheel.position.x = -W / 2 + 0.08;
    frontSteerGroup.add(frontLeftWheel);
    wheelMeshes.push(frontLeftWheel);

    const frontRightWheel = createWheel(false);
    frontRightWheel.position.x = W / 2 - 0.08;
    frontSteerGroup.add(frontRightWheel);
    wheelMeshes.push(frontRightWheel);

    // Rear Drive Axle Wheels
    const rearDriveZ = -3.1;
    const rearDriveLeft = createWheel(true);
    rearDriveLeft.position.set(-W / 2 + 0.08, 0.52, rearDriveZ);
    bus.add(rearDriveLeft);
    wheelMeshes.push(rearDriveLeft);

    const rearDriveRight = createWheel(false);
    rearDriveRight.position.set(W / 2 - 0.08, 0.52, rearDriveZ);
    bus.add(rearDriveRight);
    wheelMeshes.push(rearDriveRight);

    // Rear Tag Axle Wheels (Multi-Axle configuration)
    const rearTagZ = -4.5;
    const rearTagLeft = createWheel(true);
    rearTagLeft.position.set(-W / 2 + 0.08, 0.52, rearTagZ);
    bus.add(rearTagLeft);
    wheelMeshes.push(rearTagLeft);

    const rearTagRight = createWheel(false);
    rearTagRight.position.set(W / 2 - 0.08, 0.52, rearTagZ);
    bus.add(rearTagRight);
    wheelMeshes.push(rearTagRight);

    bus.wheelMeshes = wheelMeshes;
    bus.frontSteerGroup = frontSteerGroup;
    bus.wheelRadius = 0.52;

    return bus;
  }

  // ---------------------------------------------------------------------------
  // 4. HIGHWAY CORRIDOR & 3D ENVIRONMENT BUILDER
  // ---------------------------------------------------------------------------
  function buildHighwayEnvironment(scene) {
    // Grand Highway Spline Curve (~650 meters total loop)
    const curvePoints = [
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(120, 0, 180),
      new THREE.Vector3(260, 2.5, 280), // Highway Overpass elevation
      new THREE.Vector3(380, 4.0, 240),
      new THREE.Vector3(460, 1.5, 120),
      new THREE.Vector3(440, 0, -80),
      new THREE.Vector3(320, 0, -220),
      new THREE.Vector3(160, 0, -320),
      new THREE.Vector3(-40, 0, -280),
      new THREE.Vector3(-180, 0, -180),
      new THREE.Vector3(-220, 1.8, -40),
      new THREE.Vector3(-180, 0, 80),
      new THREE.Vector3(-80, 0, 40)
    ];

    const highwayCurve = new THREE.CatmullRomCurve3(curvePoints, true, 'centripetal', 0.5);

    // --- A. ASPHALT ROAD TUBE / RIBBON ---
    const roadWidth = 14;
    const roadSegments = 300;
    const roadPoints = highwayCurve.getPoints(roadSegments);

    const roadGeo = new THREE.BufferGeometry();
    const positions = [];
    const uvs = [];
    const indices = [];

    for (let i = 0; i <= roadSegments; i++) {
      const p = roadPoints[i % roadPoints.length];
      const tangent = highwayCurve.getTangentAt(i / roadSegments).normalize();
      const normal = new THREE.Vector3(0, 1, 0);
      const binormal = new THREE.Vector3().crossVectors(tangent, normal).normalize();

      // Left edge & Right edge
      const leftP = p.clone().addScaledVector(binormal, -roadWidth / 2);
      const rightP = p.clone().addScaledVector(binormal, roadWidth / 2);

      positions.push(leftP.x, leftP.y + 0.02, leftP.z);
      positions.push(rightP.x, rightP.y + 0.02, rightP.z);

      const v = (i / roadSegments) * 50;
      uvs.push(0, v);
      uvs.push(1, v);

      if (i < roadSegments) {
        const row = i * 2;
        indices.push(row, row + 1, row + 2);
        indices.push(row + 1, row + 3, row + 2);
      }
    }

    roadGeo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    roadGeo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
    roadGeo.setIndex(indices);
    roadGeo.computeVertexNormals();

    const roadMat = new THREE.MeshStandardMaterial({
      map: createRoadTexture(),
      roughness: 0.8,
      metalness: 0.1
    });

    const roadMesh = new THREE.Mesh(roadGeo, roadMat);
    roadMesh.receiveShadow = true;
    scene.add(roadMesh);

    // --- B. GLOWING CYAN ROUTE GUIDE LINE ---
    const routeGuideGeo = new THREE.BufferGeometry().setFromPoints(highwayCurve.getPoints(400));
    const routeGuideMat = new THREE.LineBasicMaterial({
      color: 0x38bdf8,
      linewidth: 3,
      transparent: true,
      opacity: 0.75
    });
    const routeGuideLine = new THREE.Line(routeGuideGeo, routeGuideMat);
    routeGuideLine.position.y = 0.08;
    scene.add(routeGuideLine);

    // --- C. ROADSIDE TERRAIN & HORIZON ---
    const groundGeo = new THREE.PlaneGeometry(1400, 1400, 32, 32);
    const groundMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a, // Deep slate night/twilight terrain
      roughness: 0.95,
      metalness: 0.05
    });
    const groundMesh = new THREE.Mesh(groundGeo, groundMat);
    groundMesh.rotation.x = -Math.PI / 2;
    groundMesh.position.y = -0.05;
    groundMesh.receiveShadow = true;
    scene.add(groundMesh);

    // --- D. ROADSIDE STREETLIGHTS & TREES ---
    const streetlights = [];
    const streetlightGeo = new THREE.CylinderGeometry(0.12, 0.16, 8.5);
    const poleMat = new THREE.MeshStandardMaterial({ color: 0x64748b, metalness: 0.8, roughness: 0.3 });
    const lampHeadMat = new THREE.MeshStandardMaterial({ color: 0xfef08a, emissive: 0xfef08a, emissiveIntensity: 1.0 });

    const treeTrunkGeo = new THREE.CylinderGeometry(0.3, 0.45, 3.5);
    const trunkMat = new THREE.MeshStandardMaterial({ color: 0x451a03, roughness: 0.9 });
    const foliageGeo = new THREE.ConeGeometry(2.4, 6.0, 7);
    const foliageMat = new THREE.MeshStandardMaterial({ color: 0x14532d, roughness: 0.8 });

    // Place lights and trees at regular intervals along highway perimeter
    for (let t = 0; t < 1.0; t += 0.04) {
      const pt = highwayCurve.getPointAt(t);
      const tangent = highwayCurve.getTangentAt(t).normalize();
      const binormal = new THREE.Vector3().crossVectors(tangent, new THREE.Vector3(0, 1, 0)).normalize();

      // Streetlight on outer shoulder
      const lightPos = pt.clone().addScaledVector(binormal, (roadWidth / 2) + 2.2);
      const pole = new THREE.Mesh(streetlightGeo, poleMat);
      pole.position.set(lightPos.x, lightPos.y + 4.25, lightPos.z);
      pole.castShadow = true;
      scene.add(pole);

      const lampHead = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.25, 1.2), lampHeadMat);
      lampHead.position.set(lightPos.x, lightPos.y + 8.4, lightPos.z);
      scene.add(lampHead);

      const poleLight = new THREE.PointLight(0xfef08a, 1.2, 28, 1.5);
      poleLight.position.set(lightPos.x, lightPos.y + 8.0, lightPos.z);
      scene.add(poleLight);
      streetlights.push(poleLight);

      // Cluster of roadside trees further back
      const treePos = pt.clone().addScaledVector(binormal, (roadWidth / 2) + 7.5 + Math.random() * 8);
      const trunk = new THREE.Mesh(treeTrunkGeo, trunkMat);
      trunk.position.set(treePos.x, treePos.y + 1.75, treePos.z);
      trunk.castShadow = true;
      scene.add(trunk);

      const foliage = new THREE.Mesh(foliageGeo, foliageMat);
      foliage.position.set(treePos.x, treePos.y + 5.2, treePos.z);
      foliage.castShadow = true;
      scene.add(foliage);
    }

    // --- E. OVERHEAD HIGHWAY DIRECTIONAL GANTRY SIGN ---
    const gantryPos = highwayCurve.getPointAt(0.12);
    const gantryTangent = highwayCurve.getTangentAt(0.12).normalize();
    const gantryBinormal = new THREE.Vector3().crossVectors(gantryTangent, new THREE.Vector3(0, 1, 0)).normalize();

    const gantryGroup = new THREE.Group();
    const gantryLegGeo = new THREE.CylinderGeometry(0.25, 0.25, 9.0);
    const gantryLegMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.9, roughness: 0.2 });

    const leftLeg = new THREE.Mesh(gantryLegGeo, gantryLegMat);
    leftLeg.position.set(-roadWidth / 2 - 1.2, 4.5, 0);
    gantryGroup.add(leftLeg);

    const rightLeg = new THREE.Mesh(gantryLegGeo, gantryLegMat);
    rightLeg.position.set(roadWidth / 2 + 1.2, 4.5, 0);
    gantryGroup.add(rightLeg);

    const crossBeamGeo = new THREE.BoxGeometry(roadWidth + 3.0, 0.45, 0.45);
    const crossBeam = new THREE.Mesh(crossBeamGeo, gantryLegMat);
    crossBeam.position.set(0, 8.8, 0);
    gantryGroup.add(crossBeam);

    // Green overhead highway board
    const signBoardCanvas = document.createElement('canvas');
    signBoardCanvas.width = 1024;
    signBoardCanvas.height = 256;
    const sCtx = signBoardCanvas.getContext('2d');
    sCtx.fillStyle = '#065f46'; // Express Highway Green
    sCtx.fillRect(0, 0, 1024, 256);
    sCtx.strokeStyle = '#ffffff';
    sCtx.lineWidth = 8;
    sCtx.strokeRect(10, 10, 1004, 236);

    sCtx.fillStyle = '#ffffff';
    sCtx.font = 'bold 44px sans-serif';
    sCtx.textAlign = 'center';
    sCtx.fillText('DELHI ➔ LUCKNOW HIGHWAY', 512, 85);
    sCtx.font = 'bold 36px monospace';
    sCtx.fillStyle = '#facc15';
    sCtx.fillText('AI BUS TRACK EXPRESSWAY • SPEED ZONE 80 KM/H', 512, 155);
    sCtx.font = '28px sans-serif';
    sCtx.fillStyle = '#e2e8f0';
    sCtx.fillText('KASHMERE GATE ➔ ALAMBAGH TERMINAL', 512, 210);

    const signBoardGeo = new THREE.PlaneGeometry(roadWidth * 0.75, 2.2);
    const signBoardMat = new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(signBoardCanvas) });
    const signBoard = new THREE.Mesh(signBoardGeo, signBoardMat);
    signBoard.position.set(0, 8.2, 0.25);
    gantryGroup.add(signBoard);

    gantryGroup.position.copy(gantryPos);
    gantryGroup.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), gantryTangent);
    scene.add(gantryGroup);

    return {
      curve: highwayCurve,
      streetlights
    };
  }

  // ---------------------------------------------------------------------------
  // 5. MASTER CONTROLLER CLASS: Volvo3DLiveTracker
  // ---------------------------------------------------------------------------
  class Volvo3DLiveTracker {
    constructor(containerId = 'volvo3DViewport') {
      this.container = document.getElementById(containerId);
      if (!this.container) return;

      this.scene = null;
      this.camera = null;
      this.renderer = null;
      this.controls = null;
      this.bus = null;
      this.highway = null;
      this.clock = new THREE.Clock();

      // State
      this.progress = 0.0;
      this.speedMode = 'normal'; // 'normal' (65km/h), 'express' (85km/h), 'turbo' (110km/h)
      this.currentSpeedKmh = 65.0;
      this.targetSpeedKmh = 65.0;
      this.followBus = true;
      this.isLiveMode = false;
      this.lightingMode = 'night'; // 'day', 'sunset', 'night'
      this.activeCameraPreset = 'front-left';
      this.autoOrbit = false;

      // Telemetry Data
      this.telemetry = {
        busId: 'UP32 AB 1234',
        modelName: 'Volvo 9600 Multi-Axle AC Sleeper',
        route: 'Delhi Kashmere Gate ➔ Lucknow Alambagh',
        speed: 65,
        lat: 26.8467,
        lng: 80.9462,
        status: 'ON_ROUTE',
        nextStop: 'Mathura Expressway Toll Plaza',
        eta: '08:35 PM (In 18 mins)',
        lastUpdate: 'Just now'
      };

      // Camera Offset Vector relative to bus
      this.cameraOffsets = {
        'front': new THREE.Vector3(0, 2.2, 17.0),
        'rear': new THREE.Vector3(0, 3.2, -18.5),
        'left': new THREE.Vector3(18.0, 2.0, 0),
        'right': new THREE.Vector3(-18.0, 2.0, 0),
        'front-left': new THREE.Vector3(14.0, 4.5, 14.0),
        'front-right': new THREE.Vector3(-14.0, 4.5, 14.0),
        'rear-left': new THREE.Vector3(14.0, 4.2, -14.0),
        'rear-right': new THREE.Vector3(-14.0, 4.2, -14.0),
        'top': new THREE.Vector3(0, 28.0, 0.01),
        'orbit360': new THREE.Vector3(14.0, 4.5, 14.0)
      };

      this.init();
    }

    init() {
      if (!isWebGLAvailable()) {
        this.renderFallback('WebGL is not available in your browser. Please enable hardware acceleration to view the 3D Volvo bus live simulation.');
        return;
      }

      // 1. Scene
      this.scene = new THREE.Scene();
      this.scene.background = new THREE.Color(0x020617);
      this.scene.fog = new THREE.FogExp2(0x020617, 0.0035);

      // 2. Camera
      const width = this.container.clientWidth || 800;
      const height = this.container.clientHeight || 500;
      this.camera = new THREE.PerspectiveCamera(45, width / height, 0.5, 1200);
      this.camera.position.set(20, 10, 25);

      // 3. Renderer
      this.renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: false,
        powerPreference: 'high-performance'
      });
      this.renderer.setSize(width, height);
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      this.renderer.shadowMap.enabled = true;
      this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      this.renderer.outputEncoding = THREE.sRGBEncoding;

      const canvas = this.renderer.domElement;
      canvas.className = 'volvo-webgl-canvas';
      this.container.appendChild(canvas);

      // 4. OrbitControls
      if (typeof THREE.OrbitControls !== 'undefined') {
        this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.06;
        this.controls.maxPolarAngle = Math.PI / 2 - 0.04; // Don't clip below ground
        this.controls.minDistance = 6.0;
        this.controls.maxDistance = 140.0;
      }

      // 5. Lighting Setup
      this.setupLighting();

      // 6. Build Environment & Highway
      this.highway = buildHighwayEnvironment(this.scene);

      // 7. Build Volvo 9600 Coach
      this.bus = buildVolvo9600Coach();
      this.scene.add(this.bus);

      // Initial position on highway
      const startPt = this.highway.curve.getPointAt(0);
      this.bus.position.copy(startPt);

      // 8. Event Listeners & HUD
      this.bindEvents();
      this.applyLightingMode(this.lightingMode);
      this.setCameraView('front-left');

      // Hide loading spinner
      const loader = document.getElementById('volvo3DLoader');
      if (loader) loader.classList.add('hidden');

      // 9. Start Telemetry polling
      this.startTelemetryPolling();

      // 10. Start Animation Loop
      this.animate();
    }

    setupLighting() {
      // Ambient Light
      this.ambientLight = new THREE.AmbientLight(0xffffff, 0.45);
      this.scene.add(this.ambientLight);

      // Directional Sun Light
      this.sunLight = new THREE.DirectionalLight(0xfffbeb, 1.4);
      this.sunLight.position.set(120, 160, 90);
      this.sunLight.castShadow = true;
      this.sunLight.shadow.mapSize.width = 2048;
      this.sunLight.shadow.mapSize.height = 2048;
      this.sunLight.shadow.camera.near = 10;
      this.sunLight.shadow.camera.far = 400;
      const d = 80;
      this.sunLight.shadow.camera.left = -d;
      this.sunLight.shadow.camera.right = d;
      this.sunLight.shadow.camera.top = d;
      this.sunLight.shadow.camera.bottom = -d;
      this.scene.add(this.sunLight);

      // Hemisphere Light for soft sky/ground bounce
      this.hemiLight = new THREE.HemisphereLight(0x38bdf8, 0x0f172a, 0.5);
      this.scene.add(this.hemiLight);
    }

    applyLightingMode(mode) {
      this.lightingMode = mode;
      const daySky = 0x0ea5e9;
      const sunsetSky = 0x7c2d12;
      const nightSky = 0x020617;

      if (mode === 'day') {
        this.scene.background.setHex(daySky);
        this.scene.fog.color.setHex(daySky);
        this.ambientLight.intensity = 0.85;
        this.sunLight.intensity = 1.8;
        this.sunLight.color.setHex(0xffffff);
        this.hemiLight.intensity = 0.65;
        if (this.bus?.headlightBeams) {
          this.bus.headlightBeams.forEach(b => { b.intensity = 0.6; });
        }
        if (this.highway?.streetlights) {
          this.highway.streetlights.forEach(l => { l.intensity = 0.1; });
        }
      } else if (mode === 'sunset') {
        this.scene.background.setHex(sunsetSky);
        this.scene.fog.color.setHex(sunsetSky);
        this.ambientLight.intensity = 0.45;
        this.sunLight.intensity = 1.2;
        this.sunLight.color.setHex(0xf97316);
        this.hemiLight.intensity = 0.45;
        if (this.bus?.headlightBeams) {
          this.bus.headlightBeams.forEach(b => { b.intensity = 1.8; });
        }
        if (this.highway?.streetlights) {
          this.highway.streetlights.forEach(l => { l.intensity = 0.8; });
        }
      } else { // 'night'
        this.scene.background.setHex(nightSky);
        this.scene.fog.color.setHex(nightSky);
        this.ambientLight.intensity = 0.22;
        this.sunLight.intensity = 0.35;
        this.sunLight.color.setHex(0x94a3b8);
        this.hemiLight.intensity = 0.25;
        if (this.bus?.headlightBeams) {
          this.bus.headlightBeams.forEach(b => { b.intensity = 3.2; });
        }
        if (this.highway?.streetlights) {
          this.highway.streetlights.forEach(l => { l.intensity = 1.4; });
        }
      }
    }

    setSpeedMode(mode) {
      this.speedMode = mode;
      const speeds = { normal: 65, express: 85, turbo: 110 };
      this.targetSpeedKmh = speeds[mode] || 65;

      // Update UI buttons
      document.querySelectorAll('.volvo-speed-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.speed === mode);
      });
    }

    setCameraView(presetName) {
      this.activeCameraPreset = presetName;
      this.autoOrbit = (presetName === 'orbit360');

      // Update angle buttons
      document.querySelectorAll('.volvo-angle-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.angle === presetName);
      });

      if (!this.bus) return;

      const offset = this.cameraOffsets[presetName] || this.cameraOffsets['front-left'];

      // If following bus, calculate world target
      const busPos = this.bus.position.clone();
      const busQuat = this.bus.quaternion.clone();

      // Transform offset by bus rotation for chase/front/profile views
      const worldOffset = offset.clone().applyQuaternion(busQuat);
      this.targetCameraPos = busPos.clone().add(worldOffset);

      if (presetName === 'top') {
        this.targetCameraPos.set(busPos.x, busPos.y + 26, busPos.z + 0.01);
      }

      if (this.controls) {
        this.controls.target.copy(busPos);
      }
    }

    resetCamera() {
      this.setCameraView('front-left');
    }

    toggleFollow(enable = null) {
      this.followBus = (enable !== null) ? enable : !this.followBus;
      const btn = document.getElementById('btnToggleFollow');
      if (btn) btn.classList.toggle('active', this.followBus);
    }

    toggleLiveMode() {
      this.isLiveMode = !this.isLiveMode;
      const badge = document.getElementById('volvoLiveBadge');
      if (badge) {
        if (this.isLiveMode) {
          badge.className = 'volvo-mode-badge live-active';
          badge.innerHTML = '<i class="fa-solid fa-circle"></i> 🟢 LIVE GPS ACTIVE (UP32 AB 1234)';
        } else {
          badge.className = 'volvo-mode-badge';
          badge.innerHTML = '<i class="fa-solid fa-circle"></i> 🟡 DEMO HIGHWAY SIMULATION';
        }
      }
      this.updateHud();
    }

    bindEvents() {
      // Resize handling
      window.addEventListener('resize', () => {
        if (!this.container || !this.renderer || !this.camera) return;
        const w = this.container.clientWidth;
        const h = this.container.clientHeight;
        this.camera.aspect = w / h;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(w, h);
      });

      // Pause when hidden
      document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
          this.clock.stop();
        } else {
          this.clock.start();
        }
      });
    }

    startTelemetryPolling() {
      // Periodic update from backend GPS API
      const poll = async () => {
        try {
          const res = await fetch('/api/admin/tracking/live');
          if (res.ok) {
            const data = await res.json();
            if (data?.telemetry?.length) {
              const liveBus = data.telemetry.find(b => b.reg_number.includes('1021') || b.reg_number.includes('1234')) || data.telemetry[0];
              if (liveBus) {
                this.telemetry.speed = Math.round(liveBus.speed || 62);
                this.telemetry.lat = liveBus.lat;
                this.telemetry.lng = liveBus.lng;
                this.telemetry.status = liveBus.status || 'ON_ROUTE';
                this.telemetry.lastUpdate = 'Just now (Sat Telemetry)';
                if (this.isLiveMode) {
                  this.targetSpeedKmh = this.telemetry.speed;
                }
                this.updateHud();
              }
            }
          }
        } catch (_) {}
      };

      setInterval(poll, 4500);
      poll();
    }

    updateHud() {
      const speedNumEl = document.getElementById('volvoSpeedNumber');
      const speedBadgeEl = document.getElementById('highwaySpeedBadge');
      const locTextEl = document.getElementById('volvoTelemetryLoc');
      const etaTextEl = document.getElementById('volvoTelemetryEta');

      const currentKmh = Math.round(this.currentSpeedKmh);

      if (speedNumEl) speedNumEl.textContent = currentKmh;
      if (speedBadgeEl) speedBadgeEl.textContent = `BUS EN ROUTE: ${currentKmh} KM/H (${this.speedMode.toUpperCase()})`;
      if (locTextEl) locTextEl.textContent = `${this.telemetry.lat.toFixed(4)}°N, ${this.telemetry.lng.toFixed(4)}°E (Mile 148)`;
      if (etaTextEl) etaTextEl.textContent = this.telemetry.eta;
    }

    animate() {
      requestAnimationFrame(() => this.animate());

      const delta = Math.min(this.clock.getDelta(), 0.1);

      // Smoothly interpolate speed toward target
      this.currentSpeedKmh += (this.targetSpeedKmh - this.currentSpeedKmh) * Math.min(1, delta * 3.0);

      // Physical velocity in meters/second
      const velocityMps = (this.currentSpeedKmh * 1000) / 3600;

      // 1. Advance Highway Spline Progress
      if (this.highway?.curve && this.bus) {
        const curveLength = this.highway.curve.getLength();
        const deltaProgress = (velocityMps * delta) / curveLength;
        this.progress = (this.progress + deltaProgress) % 1.0;

        // Current world point and tangent
        const currentPt = this.highway.curve.getPointAt(this.progress);
        const tangent = this.highway.curve.getTangentAt(this.progress).normalize();

        // Suspension micro-vibration bounce
        const suspensionBounce = Math.sin(this.progress * 400) * 0.015;

        this.bus.position.set(currentPt.x, currentPt.y + suspensionBounce, currentPt.z);

        // Orient bus smoothly along curve tangent
        const lookTarget = currentPt.clone().add(tangent);
        this.bus.lookAt(lookTarget);

        // 2. Rotate all 6 wheels proportionally to distance traveled
        if (this.bus.wheelMeshes && this.bus.wheelRadius) {
          const wheelAngleDelta = (velocityMps * delta) / this.bus.wheelRadius;
          this.bus.wheelMeshes.forEach(wheel => {
            wheel.rotation.x += wheelAngleDelta;
          });
        }

        // 3. Front Steer Axle Steering Yaw based on curve curvature
        if (this.bus.frontSteerGroup) {
          const nextTangent = this.highway.curve.getTangentAt((this.progress + 0.01) % 1.0).normalize();
          const turnAngle = tangent.clone().cross(nextTangent).y * 12.0;
          this.bus.frontSteerGroup.rotation.y = THREE.MathUtils.clamp(turnAngle, -0.4, 0.4);
        }

        // 4. Camera Follow Mode
        if (this.controls) {
          if (this.autoOrbit) {
            // Free 360 cinematic auto-orbit
            this.controls.autoRotate = true;
            this.controls.autoRotateSpeed = 1.8;
            this.controls.target.lerp(this.bus.position, 0.12);
          } else {
            this.controls.autoRotate = false;
            if (this.followBus) {
              this.controls.target.lerp(this.bus.position, 0.12);

              if (this.targetCameraPos) {
                // Smooth camera follow transition
                const busQuat = this.bus.quaternion.clone();
                const offset = this.cameraOffsets[this.activeCameraPreset] || this.cameraOffsets['front-left'];
                let worldOffset = offset.clone().applyQuaternion(busQuat);

                if (this.activeCameraPreset === 'top') {
                  worldOffset = new THREE.Vector3(0, 26, 0.01);
                }

                const desiredPos = this.bus.position.clone().add(worldOffset);
                this.camera.position.lerp(desiredPos, delta * 3.5);
              }
            }
          }
          this.controls.update();
        }
      }

      this.updateHud();
      this.renderer.render(this.scene, this.camera);
    }

    renderFallback(msg) {
      this.container.innerHTML = `
        <div class="volvo-webgl-fallback">
          <i class="fa-solid fa-triangle-exclamation" style="font-size:36px; color:#ef4444; margin-bottom:12px;"></i>
          <h3>3D Viewport Hardware Acceleration Disabled</h3>
          <p>${msg}</p>
          <button type="button" class="btn btn-primary" onclick="window.location.reload()" style="margin-top:14px;">↻ Retry Initialization</button>
        </div>
      `;
    }
  }

  // ---------------------------------------------------------------------------
  // 6. MINI LOGIN 3D PREVIEW BUILDER (FOR LOGIN.HTML)
  // ---------------------------------------------------------------------------
  function initVolvoMiniLoginViewer(canvasContainerId = 'miniLoginCanvasWrap') {
    const wrap = document.getElementById(canvasContainerId);
    if (!wrap || !isWebGLAvailable()) return;

    const width = wrap.clientWidth || 320;
    const height = wrap.clientHeight || 100;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x020617);

    const camera = new THREE.PerspectiveCamera(38, width / height, 0.5, 100);
    camera.position.set(12, 3.5, 10);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    renderer.outputEncoding = THREE.sRGBEncoding;

    const canvas = renderer.domElement;
    canvas.className = 'volvo-login-canvas';
    wrap.appendChild(canvas);

    // Lights
    const amb = new THREE.AmbientLight(0xffffff, 0.7);
    scene.add(amb);
    const sun = new THREE.DirectionalLight(0xfffbeb, 1.6);
    sun.position.set(20, 30, 20);
    scene.add(sun);

    // Mini Bus
    const miniBus = buildVolvo9600Coach();
    miniBus.scale.set(0.65, 0.65, 0.65);
    scene.add(miniBus);
    camera.lookAt(miniBus.position);

    let angle = 0;
    function renderMini() {
      requestAnimationFrame(renderMini);
      angle += 0.012;
      miniBus.rotation.y = angle;
      if (miniBus.wheelMeshes) {
        miniBus.wheelMeshes.forEach(w => { w.rotation.x += 0.08; });
      }
      renderer.render(scene, camera);
    }
    renderMini();
  }

  // ---------------------------------------------------------------------------
  // 6b. STUDIO 360 TURNTABLE VIEWER (FOR EXPERIENCE-360 SECTION)
  // ---------------------------------------------------------------------------
  function initVolvoStudioViewer(canvasContainerId = 'bus360Canvas') {
    const wrap = document.getElementById(canvasContainerId);
    if (!wrap || !isWebGLAvailable()) return null;

    // Clear placeholder contents
    wrap.innerHTML = '';

    const width = wrap.clientWidth || 440;
    const height = wrap.clientHeight || 280;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a101f);

    const camera = new THREE.PerspectiveCamera(38, width / height, 0.5, 100);
    camera.position.set(13, 4, 11);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputEncoding = THREE.sRGBEncoding;

    const canvas = renderer.domElement;
    canvas.className = 'volvo-studio-canvas';
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    canvas.style.display = 'block';
    canvas.style.borderRadius = '10px';
    wrap.appendChild(canvas);

    // OrbitControls for interactive studio inspection
    let controls = null;
    if (typeof THREE.OrbitControls === 'function') {
      controls = new THREE.OrbitControls(camera, renderer.domElement);
      controls.enableDamping = true;
      controls.dampingFactor = 0.05;
      controls.minDistance = 5;
      controls.maxDistance = 28;
      controls.maxPolarAngle = Math.PI / 2 + 0.05;
      controls.target.set(0, 1.2, 0);
    }

    // Studio lighting
    const amb = new THREE.AmbientLight(0xffffff, 0.9);
    scene.add(amb);

    const key = new THREE.DirectionalLight(0xfffbeb, 1.8);
    key.position.set(15, 25, 20);
    scene.add(key);

    const fill = new THREE.DirectionalLight(0x93c5fd, 0.9);
    fill.position.set(-15, 15, -15);
    scene.add(fill);

    const rim = new THREE.DirectionalLight(0xf43f5e, 0.6);
    rim.position.set(0, 10, -20);
    scene.add(rim);

    // Turntable circular floor
    const floorGeo = new THREE.CylinderGeometry(14, 14, 0.3, 48);
    const floorMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      roughness: 0.35,
      metalness: 0.5
    });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.position.y = -0.15;
    scene.add(floor);

    const grid = new THREE.GridHelper(28, 16, 0x38bdf8, 0x334155);
    grid.position.y = 0.02;
    scene.add(grid);

    // Studio Coach
    const coach = buildVolvo9600Coach();
    coach.scale.set(0.72, 0.72, 0.72);
    coach.position.set(0, 0, 0);
    scene.add(coach);

    let isAutoRotating = false;

    function renderStudio() {
      requestAnimationFrame(renderStudio);
      if (isAutoRotating) {
        coach.rotation.y += 0.012;
        if (coach.wheelMeshes) {
          coach.wheelMeshes.forEach(w => { w.rotation.x += 0.05; });
        }
      }
      if (controls) controls.update();
      renderer.render(scene, camera);
    }
    renderStudio();

    window.addEventListener('resize', () => {
      const w = wrap.clientWidth;
      const h = wrap.clientHeight;
      if (w && h) {
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        renderer.setSize(w, h);
      }
    });

    const api = {
      setAngle(deg) {
        isAutoRotating = false;
        coach.rotation.y = (Number(deg) * Math.PI) / 180;
      },
      setCameraView(viewName) {
        isAutoRotating = false;
        const d = 16;
        if (viewName === 'front') camera.position.set(0, 2.5, d);
        else if (viewName === 'rear') camera.position.set(0, 2.5, -d);
        else if (viewName === 'left') camera.position.set(-d, 2.5, 0);
        else if (viewName === 'right') camera.position.set(d, 2.5, 0);
        else if (viewName === 'top') camera.position.set(0, d * 1.2, 0.1);
        else if (viewName === 'front-left') camera.position.set(-d * 0.7, 3.5, d * 0.7);
        else camera.position.set(d * 0.7, 3.5, d * 0.7);
        if (controls) {
          controls.target.set(0, 1.2, 0);
          controls.update();
        }
      },
      zoomIn() {
        if (controls) { controls.dollyIn(1.2); controls.update(); }
      },
      zoomOut() {
        if (controls) { controls.dollyOut(1.2); controls.update(); }
      },
      reset() {
        coach.rotation.y = 0;
        camera.position.set(13, 4, 11);
        if (controls) {
          controls.target.set(0, 1.2, 0);
          controls.update();
        }
      },
      toggleAuto() {
        isAutoRotating = !isAutoRotating;
        return isAutoRotating;
      }
    };

    window.volvoStudioViewer = api;
    return api;
  }

  // ---------------------------------------------------------------------------
  // 7. GLOBAL WINDOW EXPORTS & BINDINGS
  // ---------------------------------------------------------------------------
  let trackerInstance = null;

  window.initVolvo3DTracker = function(containerId = 'volvo3DViewport') {
    if (!trackerInstance) {
      trackerInstance = new Volvo3DLiveTracker(containerId);
      window.Volvo3DTracker = trackerInstance;
    }
    return trackerInstance;
  };

  window.initVolvoMiniLoginViewer = initVolvoMiniLoginViewer;
  window.initVolvoStudioViewer = initVolvoStudioViewer;

  // Global Bridge Functions to preserve all existing UI bindings:
  window.setCameraView = function(viewName) {
    if (trackerInstance) trackerInstance.setCameraView(viewName);
  };

  window.setHighwaySpeed = function(speedMode) {
    if (trackerInstance) trackerInstance.setSpeedMode(speedMode);
  };

  window.toggleLightingMode = function(mode) {
    if (trackerInstance) trackerInstance.applyLightingMode(mode);
  };

  window.cycleLighting = function() {
    if (!trackerInstance) return;
    const modes = ['night', 'day', 'sunset'];
    const currentIdx = modes.indexOf(trackerInstance.lightingMode);
    const nextMode = modes[(currentIdx + 1) % modes.length];
    trackerInstance.applyLightingMode(nextMode);
    const btn = document.getElementById('btnToggleDayNight');
    if (btn) {
      if (nextMode === 'day') {
        btn.innerHTML = '<i class="fa-solid fa-sun text-yellow-400"></i> Day Mode';
      } else if (nextMode === 'sunset') {
        btn.innerHTML = '<i class="fa-solid fa-cloud-sun text-orange-400"></i> Sunset Mode';
      } else {
        btn.innerHTML = '<i class="fa-solid fa-moon text-blue-400"></i> Night Mode';
      }
    }
  };

  window.reset360View = function() {
    if (trackerInstance) trackerInstance.resetCamera();
  };

  window.toggleAuto360Rotation = function() {
    if (trackerInstance) trackerInstance.setCameraView('orbit360');
  };

  window.toggleFollowBus = function() {
    if (trackerInstance) trackerInstance.toggleFollow();
  };

  window.toggleLiveDemoMode = function() {
    if (trackerInstance) trackerInstance.toggleLiveMode();
  };

  // Auto-init on page load if container exists
  document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('volvo3DViewport')) {
      window.initVolvo3DTracker('volvo3DViewport');
    }
  });

})();
