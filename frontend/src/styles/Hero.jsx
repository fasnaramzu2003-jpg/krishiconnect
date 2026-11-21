
import '../styles/hero.css'

export default function Hero() {
  return (
    <section className="hero-scene" aria-labelledby="hero-title">
      <div className="clouds" aria-hidden="true">
        <span className="cloud cloud-1"></span>
        <span className="cloud cloud-2"></span>
      </div>
      <div className="leaves" aria-hidden="true">
        <span className="leaf leaf-1"></span>
        <span className="leaf leaf-2"></span>
        <span className="leaf leaf-3"></span>
        <span className="leaf leaf-4"></span>
      </div>

      <div className="hero-content">
        <p className="hero-eyebrow">Kerala's agricultural network</p>
        <h1 id="hero-title">Farming that connects all of Kerala</h1>
        <p className="hero-lead">
          KrishiConnect AI is being built to bring farmers, buyers and
          agricultural experts together with farm tools, a marketplace and AI guidance.
        </p>
        <p>
          <a className="btn btn-primary" href="#features">Explore features</a>
        </p>
      </div>

      <svg className="palm" viewBox="0 0 124 260" aria-hidden="true" focusable="false">
        <path d="M60 260 C58 200 66 140 62 90" stroke="#5b4636" strokeWidth="7" fill="none" strokeLinecap="round" />
        <path d="M62 90 C40 70 15 75 0 95 C25 82 45 85 62 90Z" fill="#176B45" />
        <path d="M62 90 C84 68 110 72 124 92 C98 80 80 84 62 90Z" fill="#176B45" />
        <path d="M62 90 C50 60 50 35 62 15 C70 40 70 65 62 90Z" fill="#176B45" />
        <path d="M62 90 C35 85 20 100 12 125 C30 108 45 100 62 90Z" fill="#72A879" />
        <path d="M62 90 C90 85 105 100 112 125 C95 108 78 100 62 90Z" fill="#72A879" />
      </svg>

      <svg className="hills" viewBox="0 0 1440 320" preserveAspectRatio="none" aria-hidden="true" focusable="false">
        <path d="M0 220 C240 140 480 260 720 200 C960 140 1200 250 1440 190 L1440 320 L0 320 Z" fill="#72A879" />
        <path d="M0 270 C300 210 600 300 900 250 C1100 215 1300 270 1440 245 L1440 320 L0 320 Z" fill="#176B45" />
      </svg>
    </section>
  )
}
