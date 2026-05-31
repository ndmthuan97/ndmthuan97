import { Check } from "lucide-react";
import homeData from "../data/home.json";
import { useReveal } from "../hooks/use-reveal";
import { assetPath } from "../utils/asset-path";
import { useEffect, useRef, useCallback } from "react";

type Pt = { x: number; y: number };
function displace(a: Pt, b: Pt, r: number, d: number): Pt[] {
  if (d === 0) return [a, b];
  const m: Pt = { x:(a.x+b.x)/2+(Math.random()-.5)*r, y:(a.y+b.y)/2+(Math.random()-.5)*r };
  return [...displace(a,m,r*.62,d-1),...displace(m,b,r*.62,d-1).slice(1)];
}
function sPts(ctx: CanvasRenderingContext2D, pts: Pt[], col: string, w: number, bl: number, a: number) {
  ctx.save(); ctx.globalAlpha=a; ctx.strokeStyle=col; ctx.lineWidth=w;
  ctx.lineCap="round"; ctx.lineJoin="round"; ctx.shadowColor=col; ctx.shadowBlur=bl;
  ctx.beginPath(); ctx.moveTo(pts[0].x,pts[0].y);
  for(let i=1;i<pts.length;i++) ctx.lineTo(pts[i].x,pts[i].y);
  ctx.stroke(); ctx.restore();
}
function bolt(ctx: CanvasRenderingContext2D, a: Pt, b: Pt, r: number, d: number, al: number) {
  const pts = displace(a,b,r,d);
  sPts(ctx,pts,"#6d28d9",14,35,al*.2); sPts(ctx,pts,"#a855f7",6,20,al*.5);
  sPts(ctx,pts,"#c084fc",2.5,10,al*.8); sPts(ctx,pts,"#f0e6ff",1,4,al);
  if(d>=3&&Math.random()>.4){
    const idx=Math.floor(pts.length*(.3+Math.random()*.4)), o=pts[idx];
    const ang=Math.atan2(b.y-a.y,b.x-a.x)+(Math.random()-.5)*1.5;
    const len=r*(.3+Math.random()*.4);
    bolt(ctx,o,{x:o.x+Math.cos(ang)*len,y:o.y+Math.sin(ang)*len},r*.5,d-2,al*.55);
  }
}
function LightningOverlay() {
  const cvRef=useRef<HTMLCanvasElement>(null), tmRef=useRef<ReturnType<typeof setTimeout>|null>(null), rafRef=useRef<number|null>(null);
  const strike=useCallback(()=>{
    if(document.hidden){tmRef.current=setTimeout(strike,1000);return;}
    const cv=cvRef.current; if(!cv) return;
    const ctx=cv.getContext("2d"); if(!ctx) return;
    const r=cv.getBoundingClientRect(), dpr=window.devicePixelRatio||1;
    const W=Math.round(r.width*dpr), H=Math.round(r.height*dpr);
    if(!W||!H){tmRef.current=setTimeout(strike,500);return;}
    if(cv.width!==W||cv.height!==H){cv.width=W;cv.height=H;}
    const off=document.createElement("canvas"); off.width=W; off.height=H;
    const oc=off.getContext("2d")!;
    const cnt=Math.random()<.35?2:1;
    for(let i=0;i<cnt;i++){
      bolt(oc,{x:W*(.15+Math.random()*.7),y:H*Math.random()*.3},{x:W*(.1+Math.random()*.8),y:H*(.6+Math.random()*.4)},W*.38,7,1);
    }
    let fade=1;
    const tick=()=>{
      if(document.hidden){tmRef.current=setTimeout(strike,1000);return;}
      const c=cvRef.current?.getContext("2d"); if(!c) return;
      c.clearRect(0,0,W,H); fade-=.04;
      if(fade<=0){tmRef.current=setTimeout(strike,1e3+Math.random()*2500);return;}
      c.globalAlpha=fade; c.drawImage(off,0,0); c.globalAlpha=1;
      rafRef.current=requestAnimationFrame(tick);
    };
    if(rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current=requestAnimationFrame(tick);
  },[]);
  useEffect(()=>{
    if(window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    tmRef.current=setTimeout(strike,200);
    return ()=>{ if(tmRef.current) clearTimeout(tmRef.current); if(rafRef.current) cancelAnimationFrame(rafRef.current); };
  },[strike]);
  return <canvas ref={cvRef} aria-hidden="true" className="absolute inset-0 w-full h-full pointer-events-none z-20" style={{mixBlendMode:"screen"}}/>;
}

// ─── Glowing Short Meteors (Sao băng) ────────────────────────────────────────
function AtomicRings() {
  const backRef  = useRef<HTMLCanvasElement>(null);
  const frontRef = useRef<HTMLCanvasElement>(null);
  const rafRef   = useRef<number|null>(null);

  useEffect(()=>{
    if(window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const bCv=backRef.current, fCv=frontRef.current;
    if(!bCv||!fCv) return;
    const bCtx=bCv.getContext("2d",{alpha:true}), fCtx=fCv.getContext("2d",{alpha:true});
    if(!bCtx||!fCtx) return;

    type CS=[number,number,number,number]; // [stop, r, g, b]
    // Multi-colour gradient sets — original vivid rainbow palette (dark).
    const DARK_SETS:CS[][]=[
      [[0,255,220,120],[.12,30,180,255],[.24,0,220,255],[.38,20,170,240],[.48,110,50,240],[.54,240,60,200],[.60,255,130,20],[.70,255,50,10],[.80,210,20,10],[.90,140,40,240],[1,255,220,120]],
      [[0,240,255,255],[.25,100,230,255],[.50,0,190,255],[.75,0,130,230],[1,240,255,255]],
      [[0,255,250,150],[.20,255,200,40],[.45,255,110,10],[.70,220,30,10],[.88,170,10,10],[1,255,250,150]],
      [[0,255,255,255],[.20,255,170,220],[.40,245,50,200],[.65,170,10,210],[.88,80,30,240],[1,255,255,255]],
      [[0,200,255,240],[.28,0,255,190],[.50,0,200,140],[.70,100,100,255],[.88,200,70,255],[1,200,255,240]],
    ];
    // Deeper, saturated variants for light backgrounds.
    const LIGHT_SETS:CS[][]=[
      [[0,37,99,235],[.25,124,58,237],[.5,8,145,178],[.75,219,39,119],[1,37,99,235]],
      [[0,124,58,237],[.33,37,99,235],[.66,8,145,178],[1,124,58,237]],
      [[0,202,138,4],[.3,219,39,119],[.6,124,58,237],[1,202,138,4]],
      [[0,8,145,178],[.33,13,148,136],[.66,37,99,235],[1,8,145,178]],
      [[0,219,39,119],[.4,124,58,237],[.75,37,99,235],[1,219,39,119]],
    ];
    function lc(stops:CS[],t:number):[number,number,number]{
      const s=((t%1)+1)%1;
      for(let i=0;i<stops.length-1;i++){
        const [t0,r0,g0,b0]=stops[i],[t1,r1,g1,b1]=stops[i+1];
        if(s>=t0&&s<=t1){const p=(s-t0)/(t1-t0);return[~~(r0+(r1-r0)*p),~~(g0+(g1-g0)*p),~~(b0+(b1-b0)*p)];}
      }
      const l=stops[stops.length-1]; return[l[1],l[2],l[3]];
    }

    // Theme detection → switch blend mode + palette live.
    const isDarkNow = () => document.documentElement.classList.contains("dark");
    let dark = isDarkNow();
    const applyBlend = () => {
      const mode = dark ? "screen" : "source-over";
      bCv.style.mixBlendMode = mode; fCv.style.mixBlendMode = mode;
    };
    applyBlend();
    const obs = new MutationObserver(() => {
      const d = isDarkNow();
      if (d !== dark) { dark = d; applyBlend(); }
    });
    obs.observe(document.documentElement, { attributes:true, attributeFilter:["class"] });

    interface M{ plane:number;tilt:number;planeDrift:number;ePhase:number;eSpeed:number;ci:number;al:number;rF:number; }
    const RINGS:M[]=[
      {plane:0,          tilt:.34,planeDrift: .0003,ePhase:0,           eSpeed: .034,ci:0,al:1.00,rF:1.00},
      {plane:Math.PI*2/3,tilt:.42,planeDrift:-.0004,ePhase:Math.PI*.66, eSpeed:-.046,ci:1,al:.92,rF:.96},
      {plane:Math.PI*4/3,tilt:.30,planeDrift: .0004,ePhase:Math.PI*1.33,eSpeed: .040,ci:2,al:.86,rF:1.05},
      {plane:Math.PI/3,  tilt:.52,planeDrift:-.0003,ePhase:Math.PI*1.8, eSpeed:-.055,ci:3,al:.74,rF:.90},
      {plane:Math.PI,    tilt:.26,planeDrift: .0005,ePhase:Math.PI*.4,  eSpeed: .064,ci:4,al:.62,rF:1.08},
    ];
    // Randomise each meteor's gradient on mount → distinct colours, fresh every load.
    const palCount = DARK_SETS.length; // both palettes share the same length
    const shuffled = Array.from({length:palCount}, (_,i)=>i).sort(()=>Math.random()-0.5);
    RINGS.forEach((m,i)=>{ m.ci = shuffled[i % palCount]; });

    let lastT=performance.now(), fi=0;

    function sync(cv:HTMLCanvasElement):[number,number]{
      const dpr=window.devicePixelRatio||1, r=cv.getBoundingClientRect();
      const W=Math.round(r.width*dpr), H=Math.round(r.height*dpr);
      if(cv.width!==W||cv.height!==H){cv.width=W;cv.height=H;}
      return[W,H];
    }

    function render(now:number){
      if(document.hidden){rafRef.current=requestAnimationFrame(render);return;}
      const dt=Math.min((now-lastT)/16.67,2.5); lastT=now; fi++;
      const[W,H]=sync(bCv!); sync(fCv!);
      if(!W||!H){rafRef.current=requestAnimationFrame(render);return;}

      bCtx!.clearRect(0,0,W,H); fCtx!.clearRect(0,0,W,H);
      const op = dark ? "screen" : "source-over";
      bCtx!.globalCompositeOperation=op; fCtx!.globalCompositeOperation=op;

      const palette = dark ? DARK_SETS : LIGHT_SETS;
      const cx=W*.5,cy=H*.5, baseR=Math.min(W,H)*.35, pulse=.9+Math.sin(fi*.04)*.1;

      for(const ring of RINGS){
        ring.plane+=ring.planeDrift*dt;
        ring.ePhase+=ring.eSpeed*dt;

        const R=baseR*ring.rF, wB=R*.045;
        const stops=palette[ring.ci];
        const [cr,cg,cb]=lc(stops,0); // head/glow base colour (gradient start)
        const sinI=Math.sqrt(Math.max(0,1-ring.tilt*ring.tilt));
        const dir = Math.sign(ring.eSpeed) || 1;

        for(const ctx of[bCtx!,fCtx!]){
          ctx.save(); ctx.translate(cx,cy); ctx.rotate(ring.plane); ctx.scale(1,ring.tilt);
          ctx.lineCap="round"; ctx.lineJoin="round";
        }

        // Faint orbit guide-line
        for(let i=0;i<60;i++){
          const a0=i*(Math.PI*2/60), a1=a0+(Math.PI*2/60)+.02, midA=a0+(Math.PI/60);
          const dz=Math.sin(midA)*sinI;
          const ctxToUse=dz>0?bCtx!:fCtx!;
          const tFade=(dz>0?0.10:0.16)*(dark?1:.7);
          ctxToUse.beginPath(); ctxToUse.arc(0,0,R,a0,a1);
          ctxToUse.strokeStyle=`rgba(${cr},${cg},${cb},${tFade*ring.al})`;
          ctxToUse.lineWidth=1; ctxToUse.stroke();
        }

        // Long tapering shooting-star tail (width thins toward the end,
        // colour shifts hot-white near the head → core colour → fade out).
        const TAIL_LEN=Math.PI*0.62, SEGS=44, stepA=TAIL_LEN/SEGS;
        for(let i=0;i<SEGS;i++){
          const a1=ring.ePhase - dir*i*stepA;
          const a0=a1 - dir*(stepA+.010);
          const startA=dir>0?a0:a1, endA=dir>0?a1:a0;
          const midA=(a0+a1)/2;
          const dz=Math.sin(midA)*sinI;
          const f=i/SEGS;                         // 0 = at head, 1 = tail end
          const tailFade=Math.pow(1-f,1.7);       // brightness falloff
          if(tailFade<.008) continue;
          const ctxToUse=dz>0?bCtx!:fCtx!;
          const depthFade=(dz>0)?Math.max(0,1-dz*2.4):1;
          if(depthFade<=0) continue;
          const alpha=ring.al*pulse*tailFade*depthFade;
          const taper=Math.pow(1-f,0.8);          // width thins toward the tail
          // Multi-colour gradient running along the tail.
          const [lr,lg,lb]=lc(stops,f);
          if(dark){
            ctxToUse.beginPath(); ctxToUse.arc(0,0,R,startA,endA);
            ctxToUse.strokeStyle=`rgba(${lr},${lg},${lb},${alpha*.28})`; ctxToUse.lineWidth=Math.max(1,wB*3.6*taper); ctxToUse.stroke();
            ctxToUse.beginPath(); ctxToUse.arc(0,0,R,startA,endA);
            ctxToUse.strokeStyle=`rgba(${lr},${lg},${lb},${alpha})`; ctxToUse.lineWidth=Math.max(1,wB*1.25*taper); ctxToUse.stroke();
          }else{
            ctxToUse.beginPath(); ctxToUse.arc(0,0,R,startA,endA);
            ctxToUse.strokeStyle=`rgba(${lr},${lg},${lb},${alpha*.20})`; ctxToUse.lineWidth=Math.max(1,wB*2.6*taper); ctxToUse.stroke();
            ctxToUse.beginPath(); ctxToUse.arc(0,0,R,startA,endA);
            ctxToUse.strokeStyle=`rgba(${lr},${lg},${lb},${alpha*.8})`; ctxToUse.lineWidth=Math.max(1,wB*.9*taper); ctxToUse.stroke();
          }
        }

        // Bright head — fireball: outer glow + colour halo + white-hot core
        const hX=R*Math.cos(ring.ePhase), hY=R*Math.sin(ring.ePhase);
        const hdz=Math.sin(ring.ePhase)*sinI;
        const hCtx=hdz>0?bCtx!:fCtx!;
        const hdFade=(hdz>0)?Math.max(0,1-hdz*2.4):1;
        if (hdFade > 0) {
            const hAl=ring.al*pulse*hdFade;
            const glowR=wB*(dark?6:4);
            // outer glow
            hCtx.beginPath(); hCtx.arc(hX,hY,glowR,0,Math.PI*2);
            const rG=hCtx.createRadialGradient(hX,hY,0,hX,hY,glowR);
            rG.addColorStop(0,`rgba(${cr},${cg},${cb},${hAl*(dark?.85:.5)})`);
            rG.addColorStop(.5,`rgba(${cr},${cg},${cb},${hAl*(dark?.35:.22)})`);
            rG.addColorStop(1,`rgba(${cr},${cg},${cb},0)`);
            hCtx.fillStyle=rG; hCtx.fill();
            // bright core with hot-white centre
            const coreR=wB*(dark?1.5:1.1);
            hCtx.beginPath(); hCtx.arc(hX,hY,coreR,0,Math.PI*2);
            const cG=hCtx.createRadialGradient(hX,hY,0,hX,hY,coreR);
            if(dark){
              cG.addColorStop(0,`rgba(255,255,255,${hAl})`);
              cG.addColorStop(.55,`rgba(${Math.min(255,cr+120)},${Math.min(255,cg+120)},${Math.min(255,cb+120)},${hAl})`);
              cG.addColorStop(1,`rgba(${cr},${cg},${cb},${hAl*.5})`);
            }else{
              cG.addColorStop(0,`rgba(${Math.min(255,cr+90)},${Math.min(255,cg+90)},${Math.min(255,cb+90)},${hAl})`);
              cG.addColorStop(1,`rgba(${cr},${cg},${cb},${hAl})`);
            }
            hCtx.fillStyle=cG; hCtx.fill();
        }

        for(const ctx of[bCtx!,fCtx!]) ctx.restore();
      }
      rafRef.current=requestAnimationFrame(render);
    }
    rafRef.current=requestAnimationFrame(render);
    return()=>{ if(rafRef.current) cancelAnimationFrame(rafRef.current); obs.disconnect(); };
  },[]);

  const cs: React.CSSProperties = {
    position:"absolute", top:"50%", left:"50%",
    transform:"translate(-50%,-50%)",
    width:"142.5%", height:"142.5%",
    pointerEvents:"none",
  };
  return (
    <>
      <canvas ref={backRef}  aria-hidden="true" style={{...cs, zIndex:1}} />
      <canvas ref={frontRef} aria-hidden="true" style={{...cs, zIndex:3}} />
    </>
  );
}

export function HeroSection() {
  const { name, role, bio, profileImage } = homeData;
  const highlights = (homeData as { highlights?: string[] }).highlights ?? [];
  const goal = (homeData as { goal?: string }).goal ?? "";
  const { isVisible, ref }  = useReveal(0.05);

  const displayName = name
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase()); // MINH THUAN -> Minh Thuan

  return (
    <section id="home" ref={ref} className="min-h-screen flex items-center relative overflow-hidden pt-28 pb-16">
      <div className="container mx-auto px-6 md:px-10 lg:px-20">
        <div className="grid lg:grid-cols-2 items-center gap-12 lg:gap-16 w-full max-w-6xl mx-auto">

          {/* ── Left: orbit portrait (effect preserved) ─────────── */}
          <div className={`order-1 flex justify-center ${isVisible ? "animate-in zoom-in-95 fade-in duration-1000" : "opacity-0"}`}>
            <div
              className="relative w-72 h-72 md:w-96 md:h-96 lg:w-[28rem] lg:h-[28rem] flex items-center justify-center"
              style={{ isolation: "isolate" }}
            >
              <AtomicRings />
              <div className="absolute rounded-full overflow-hidden bg-[#0a0a0a]"
                style={{ width: "74%", height: "74%", zIndex: 2 }}>
                <img src={assetPath(profileImage)} alt={`${name} - ${role}`}
                  className="w-full h-full object-cover object-[center_20%]" />
                <LightningOverlay />
              </div>
            </div>
          </div>

          {/* ── Right: copy ──────────────────────────────────────── */}
          <div className="order-2 text-center lg:text-left">
            {/* Name */}
            <h1 className={`font-display font-bold tracking-tight text-[2.5rem] leading-[1.05] md:text-6xl lg:text-[4rem] mb-5 flex flex-wrap items-baseline justify-center lg:justify-start gap-x-4 ${isVisible ? "animate-in fade-in slide-in-from-bottom-3 duration-700 delay-100 fill-mode-backwards" : "opacity-0"}`}>
              <span className="text-foreground">Hi, I&apos;m</span>
              <span className="bg-gradient-to-r from-blue-500 via-violet-500 to-cyan-400 bg-clip-text text-transparent">
                {displayName}.
              </span>
            </h1>

            {/* Bio — personal intro */}
            <p className={`text-muted-foreground text-base md:text-lg leading-relaxed max-w-xl mx-auto lg:mx-0 mb-6 ${isVisible ? "animate-in fade-in slide-in-from-bottom-3 duration-700 delay-200 fill-mode-backwards" : "opacity-0"}`}>
              {bio}
            </p>

            {/* Highlights */}
            {highlights.length > 0 && (
              <ul className={`space-y-2.5 mb-7 max-w-xl mx-auto lg:mx-0 text-left ${isVisible ? "animate-in fade-in slide-in-from-bottom-3 duration-700 delay-300 fill-mode-backwards" : "opacity-0"}`}>
                {highlights.map((h, i) => (
                  <li key={i} className="flex items-start gap-2.5">
                    <span className="mt-0.5 flex h-5 w-5 items-center justify-center rounded-full brand-soft shrink-0">
                      <Check size={12} strokeWidth={3} />
                    </span>
                    <span className="text-foreground/80 text-sm leading-relaxed">{h}</span>
                  </li>
                ))}
              </ul>
            )}

            {/* Goal — objective */}
            {goal && (
              <div className={`max-w-xl mx-auto lg:mx-0 ${isVisible ? "animate-in fade-in slide-in-from-bottom-3 duration-700 delay-[400ms] fill-mode-backwards" : "opacity-0"}`}>
                <p className="mono-label text-muted-foreground mb-2">My goal</p>
                <div className="flex items-start gap-3 text-left">
                  <span className="mt-1 w-1 self-stretch rounded-full bg-brand shrink-0" />
                  <p className="text-foreground/90 text-base leading-relaxed italic">
                    {goal}
                  </p>
                </div>
              </div>
            )}
          </div>

        </div>
      </div>
    </section>
  );
}
