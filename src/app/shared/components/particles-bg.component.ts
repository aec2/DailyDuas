import {
  Component, ElementRef, OnDestroy, AfterViewInit,
  inject, PLATFORM_ID, viewChild,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import type { BufferAttribute } from 'three';

@Component({
  selector: 'app-particles-bg',
  standalone: true,
  host: { style: 'position:absolute;inset:0;z-index:0;pointer-events:none;overflow:hidden;' },
  template: `<canvas #canvas style="width:100%;height:100%;display:block;"></canvas>`,
})
export class ParticlesBackgroundComponent implements AfterViewInit, OnDestroy {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly canvasRef = viewChild.required<ElementRef<HTMLCanvasElement>>('canvas');
  private animId = 0;
  private renderer: { dispose(): void; setSize(w: number, h: number, b: boolean): void; setPixelRatio(r: number): void; setClearColor(c: number, a: number): void; render(s: unknown, c: unknown): void } | null = null;
  private ro: ResizeObserver | null = null;

  async ngAfterViewInit() {
    if (!isPlatformBrowser(this.platformId)) return;

    const THREE = await import('three');
    const canvas = this.canvasRef().nativeElement;
    const parent = canvas.parentElement!;

    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: false });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);
    this.renderer = renderer;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, 1, 0.1, 1000);
    camera.position.z = 5;

    const resize = () => {
      const w = parent.clientWidth || window.innerWidth;
      const h = parent.clientHeight || window.innerHeight;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    };
    resize();
    this.ro = new ResizeObserver(resize);
    this.ro.observe(parent);

    const COUNT = 180;
    const positions = new Float32Array(COUNT * 3);
    const velocities = new Float32Array(COUNT * 2);

    for (let i = 0; i < COUNT; i++) {
      positions[i * 3]     = (Math.random() - 0.5) * 14;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 22;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 3;
      velocities[i * 2]     = (Math.random() - 0.5) * 0.0018;
      velocities[i * 2 + 1] = (Math.random() - 0.5) * 0.0018;
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const accentRaw = getComputedStyle(document.documentElement).getPropertyValue('--dd-accent').trim();
    const color = new THREE.Color(accentRaw || '#7a9a8f');

    const material = new THREE.PointsMaterial({
      color,
      size: 0.055,
      transparent: true,
      opacity: 0.35,
      sizeAttenuation: true,
    });

    const points = new THREE.Points(geometry, material);
    scene.add(points);

    const BX = 7, BY = 11;
    const posAttr = geometry.attributes['position'] as BufferAttribute;

    const animate = () => {
      this.animId = requestAnimationFrame(animate);
      for (let i = 0; i < COUNT; i++) {
        let x = posAttr.getX(i) + velocities[i * 2];
        let y = posAttr.getY(i) + velocities[i * 2 + 1];
        if (x > BX) x = -BX;
        if (x < -BX) x = BX;
        if (y > BY) y = -BY;
        if (y < -BY) y = BY;
        posAttr.setXY(i, x, y);
      }
      posAttr.needsUpdate = true;
      renderer.render(scene, camera);
    };
    animate();
  }

  ngOnDestroy() {
    cancelAnimationFrame(this.animId);
    this.ro?.disconnect();
    this.renderer?.dispose();
  }
}
