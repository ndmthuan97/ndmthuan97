import { ArrowRight } from "lucide-react";
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
  return <canvas ref={cvRef} className="absolute inset-0 w-full h-full pointer-events-none z-20" style={{mixBlendMode:"screen"}}/>;
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

    type CS=[number,number,number,number];
    const SETS:CS[][]=[
      [[0,255,220,120],[.12,30,180,255],[.24,0,220,255],[.38,20,170,240],[.48,110,50,240],[.54,240,60,200],[.60,255,130,20],[.70,255,50,10],[.80,210,20,10],[.90,140,40,240],[1,255,220,120]],
      [[0,240,255,255],[.25,100,230,255],[.50,0,190,255],[.75,0,130,230],[1,240,255,255]],
      [[0,255,250,150],[.20,255,200,40],[.45,255,110,10],[.70,220,30,10],[.88,170,10,10],[1,255,250,150]],
      [[0,255,255,255],[.20,255,170,220],[.40,245,50,200],[.65,170,10,210],[.88,80,30,240],[1,255,255,255]],
      [[0,200,255,240],[.28,0,255,190],[.50,0,200,140],[.70,100,100,255],[.88,200,70,255],[1,200,255,240]],
      [[0,255,240,60],[.30,255,255,200],[.55,180,230,255],[.78,40,160,255],[1,255,240,60]],
    ];
    function lc(stops:CS[],t:number):[number,number,number]{
      const s=((t%1)+1)%1;
      for(let i=0;i<stops.length-1;i++){
        const [t0,r0,g0,b0]=stops[i],[t1,r1,g1,b1]=stops[i+1];
        if(s>=t0&&s<=t1){const p=(s-t0)/(t1-t0);return[~~(r0+(r1-r0)*p),~~(g0+(g1-g0)*p),~~(b0+(b1-b0)*p)];}
      }
      const l=stops[stops.length-1]; return[l[1],l[2],l[3]];
    }

    interface R{ plane:number;tilt:number;planeDrift:number;ePhase:number;eSpeed:number;cs:number;al:number;rF:number; }
    const RINGS:R[]=[
      {plane:0,          tilt:.35,planeDrift: .0003,ePhase:0,           eSpeed: .030,cs:0,al:.92,rF:1.00},
      {plane:Math.PI*2/3,tilt:.40,planeDrift:-.0004,ePhase:Math.PI*.66, eSpeed:-.042,cs:2,al:.85,rF:.97},
      {plane:Math.PI*4/3,tilt:.32,planeDrift: .0004,ePhase:Math.PI*1.33,eSpeed: .035,cs:1,al:.80,rF:1.03},
      {plane:Math.PI/3,  tilt:.50,planeDrift:-.0003,ePhase:Math.PI*1.8, eSpeed:-.050,cs:3,al:.68,rF:.90},
      {plane:Math.PI,    tilt:.28,planeDrift: .0005,ePhase:Math.PI*.4,  eSpeed: .060,cs:5,al:.55,rF:1.06},
    ];

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
      bCtx!.globalCompositeOperation="screen"; fCtx!.globalCompositeOperation="screen";

      const cx=W*.5,cy=H*.5, baseR=Math.min(W,H)*.35, pulse=.88+Math.sin(fi*.038)*.12;

      for(const ring of RINGS){
        ring.plane+=ring.planeDrift*dt;
        ring.ePhase+=ring.eSpeed*dt;

        const R=baseR*ring.rF, wB=R*.05, stops=SETS[ring.cs];
        const sinI=Math.sqrt(Math.max(0,1-ring.tilt*ring.tilt));
        const dir = Math.sign(ring.eSpeed) || 1;

        for(const ctx of[bCtx!,fCtx!]){
          ctx.save(); ctx.translate(cx,cy); ctx.rotate(ring.plane); ctx.scale(1,ring.tilt);
          ctx.lineCap="butt"; ctx.lineJoin="round";
        }

        const trackSteps=60;
        const tArc=(Math.PI*2)/trackSteps;
        for(let i=0;i<trackSteps;i++){
          const a0=i*tArc, a1=a0+tArc+.02, midA=a0+tArc/2;
          const dz=Math.sin(midA)*sinI;
          const ctxToUse=dz>0?bCtx!:fCtx!;
          const tFade = dz>0 ? Math.max(0, 0.20 - dz*0.2) : 0.35;
          if (tFade <= 0) continue;
          const cFrac=((midA%(Math.PI*2))+Math.PI*2)%(Math.PI*2)/(Math.PI*2);
          const [tr,tg,tb]=lc(stops,cFrac);
          ctxToUse.beginPath(); ctxToUse.arc(0,0,R,a0,a1);
          ctxToUse.strokeStyle=`rgba(${tr},${tg},${tb},${tFade*ring.al})`;
          ctxToUse.lineWidth=1.8; ctxToUse.stroke();
        }

        const TAIL_LEN=Math.PI*0.42;
        const SEGS=30;
        const step=TAIL_LEN/SEGS;

        for(let i=0;i<SEGS;i++){
          const a1=ring.ePhase - dir*i*step;
          const a0=a1 - dir*(step+.015);
          const startA=dir>0?a0:a1;
          const endA=dir>0?a1:a0;
          const midA=(a0+a1)/2;
          const dz=Math.sin(midA)*sinI;
          const tFrac=1-(i/SEGS);
          const tailFade=Math.pow(tFrac,2.5);
          if(tailFade<.01) continue;
          const cFrac=((midA%(Math.PI*2))+Math.PI*2)%(Math.PI*2)/(Math.PI*2);
          const[r,g,b]=lc(stops,cFrac);
          const ctxToUse=dz>0?bCtx!:fCtx!;
          const depthFade=(dz>0)?Math.max(0,1-dz*2.5):1;
          if(depthFade<=0) continue;
          const alpha=ring.al*pulse*tailFade*depthFade;
          const br=Math.min(255,r+180), bg=Math.min(255,g+180), bb=Math.min(255,b+180);
          ctxToUse.beginPath(); ctxToUse.arc(0,0,R,startA,endA);
          ctxToUse.strokeStyle=`rgba(${r},${g},${b},${alpha*.55})`;
          ctxToUse.lineWidth=wB*3.8; ctxToUse.stroke();
          ctxToUse.beginPath(); ctxToUse.arc(0,0,R,startA,endA);
          ctxToUse.strokeStyle=`rgba(${r},${g},${b},${alpha*.85})`;
          ctxToUse.lineWidth=wB*1.5; ctxToUse.stroke();
          ctxToUse.beginPath(); ctxToUse.arc(0,0,R,startA,endA);
          ctxToUse.strokeStyle=`rgba(${br},${bg},${bb},${alpha*1.0})`;
          ctxToUse.lineWidth=Math.max(2.5,wB*.7); ctxToUse.stroke();
        }

        const hX=R*Math.cos(ring.ePhase), hY=R*Math.sin(ring.ePhase);
        const hdz=Math.sin(ring.ePhase)*sinI;
        const hCtx=hdz>0?bCtx!:fCtx!;
        const hdFade=(hdz>0)?Math.max(0,1-hdz*2.5):1;

        if (hdFade > 0) {
            const hFrac=((ring.ePhase%(Math.PI*2))+Math.PI*2)%(Math.PI*2)/(Math.PI*2);
            const[hr,hg,hb]=lc(stops,hFrac);
            const hAl=ring.al*pulse*hdFade;
            hCtx.beginPath(); hCtx.arc(hX,hY,wB*4.8,0,Math.PI*2);
            const rG=hCtx.createRadialGradient(hX,hY,0,hX,hY,wB*4.8);
            rG.addColorStop(0,`rgba(${hr},${hg},${hb},${hAl*1.0})`);rG.addColorStop(1,`rgba(${hr},${hg},${hb},0)`);
            hCtx.fillStyle=rG; hCtx.fill();
            hCtx.beginPath(); hCtx.arc(hX,hY,wB*.85,0,Math.PI*2);
            hCtx.fillStyle=`rgba(255,255,255,${hAl*1.0})`; hCtx.fill();
        }

        for(const ctx of[bCtx!,fCtx!]) ctx.restore();
      }
      rafRef.current=requestAnimationFrame(render);
    }
    rafRef.current=requestAnimationFrame(render);
    return()=>{ if(rafRef.current) cancelAnimationFrame(rafRef.current); };
  },[]);

  const cs: React.CSSProperties = {
    position:"absolute", top:"50%", left:"50%",
    transform:"translate(-50%,-50%)",
    width:"142.5%", height:"142.5%",
    mixBlendMode:"screen", pointerEvents:"none",
  };
  return (
    <>
      <canvas ref={backRef}  style={{...cs, zIndex:1}} />
      <canvas ref={frontRef} style={{...cs, zIndex:3}} />
    </>
  );
}

export function HeroSection({ onNavigate }: { onNavigate?: (section: string) => void }) {
  const { name, role, bio } = homeData;
  const { isVisible, ref }  = useReveal(0.05);

  return (
    <section id="home" ref={ref} className="min-h-screen flex items-center relative overflow-hidden">
      <div className="container mx-auto px-6 md:px-12 lg:px-20 flex justify-center">
        <div className="flex flex-col lg:flex-row items-center justify-center gap-12 lg:gap-20 w-full max-w-7xl">

          <div className={`relative z-10 flex-shrink-0 ${isVisible?"animate-in zoom-in fade-in duration-1000":"opacity-0"}`}>
            <div className="relative w-72 h-72 md:w-96 md:h-96 lg:w-[28rem] lg:h-[28rem] flex items-center justify-center"
              style={{ isolation: "isolate" }}>
              <div className="absolute -inset-6 rounded-full bg-[radial-gradient(50%_50%_at_50%_50%,rgba(100,40,200,0.18)_0%,rgba(17,7,31,0)_100%)] blur-2xl pointer-events-none" style={{zIndex:0}} />
              <AtomicRings />
              <div className="absolute rounded-full overflow-hidden bg-[#0a0a0a]"
                style={{ width:"74%", height:"74%", zIndex:2 }}>
                <img src={assetPath("/profile.JPG")} alt={`${name} - ${role}`}
                  className="w-full h-full object-cover object-[center_20%]" />
                <LightningOverlay />
              </div>
            </div>
          </div>

          <div className="flex-1 text-center lg:text-left z-10 max-w-2xl">
            <div className={`relative mb-4 ${isVisible?"animate-in slide-in-from-right fade-in duration-1000 delay-300 fill-mode-backwards":"opacity-0"}`}>
              <div className="flex items-center justify-center lg:justify-start gap-6">
                <span className="w-12 h-1 bg-white shadow-[0_0_15px_rgba(255,255,255,0.4)] rounded-full flex-shrink-0"/>
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white to-[#a1a1a1]">
                  {`I'M ${name.toUpperCase()}`}
                </h1>
              </div>
            </div>

            {/* Role badge */}
            <div className={`mb-6 flex justify-center lg:justify-start ${isVisible?"animate-in slide-in-from-right fade-in duration-1000 delay-400 fill-mode-backwards":"opacity-0"}`}>
              <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-white/20 bg-white/8 text-white text-sm font-semibold tracking-widest uppercase">
                <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
                {role}
              </span>
            </div>

            <p className={`text-muted-foreground text-base md:text-lg leading-relaxed max-w-xl mx-auto lg:mx-0 mb-8 whitespace-pre-line ${isVisible?"animate-in slide-in-from-left fade-in duration-1000 delay-500 fill-mode-backwards":"opacity-0"}`}>
              {bio}
            </p>

            <div className={isVisible?"animate-in fade-in slide-in-from-bottom duration-1000 delay-700 fill-mode-backwards":"opacity-0"}>
              <button type="button" onClick={()=>onNavigate?.("about")}
                className="group inline-flex items-center gap-3 px-2 py-2 pr-6 rounded-full border border-white/15 bg-[#111111]/40 backdrop-blur-sm text-foreground font-semibold tracking-widest text-sm uppercase hover:border-white/30 hover:bg-[#111111]/80 motion-safe:transition-all motion-safe:duration-300">
                <span className="w-10 h-10 rounded-full bg-white flex items-center justify-center flex-shrink-0 group-hover:bg-[#e5e5e5] motion-safe:transition-all motion-safe:duration-300">
                  <ArrowRight className="w-4 h-4 text-[#0a0a0a] group-hover:translate-x-0.5 motion-safe:transition-transform motion-safe:duration-300"/>
                </span>
                <span className="text-muted-foreground group-hover:text-white motion-safe:transition-colors motion-safe:duration-300">MORE ABOUT ME</span>
              </button>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
