
import '../styles/features.css'
import useScrollReveal from '../hooks/useScrollReveal.js'
const FEATURES = [
  {
    title: 'Farm and crop management',
    text: 'Keep farms, fields, crops and farming activities in one organised place.',
  },
  {
    title: 'AI farming assistant',
    text: 'Ask farming questions in Malayalam or English and get answers with sources.',
  },
  {
    title: 'Crop health check',
    text: 'Upload a photo of a leaf to get possible causes and suggestions, with expert escalation.',
  },
  {
    title: 'Marketplace',
    text: 'List produce and connect directly with buyers, including group selling.',
  },
  {
    title: 'Market intelligence',
    text: 'Compare verified market prices and see how they change over time.',
  },
  {
    title: 'Farming community',
    text: 'Ask questions, share experience and get answers from experts.',
  },
  {
    title: 'Expert network',
    text: 'Reach verified agricultural experts for consultations.',
  },
]

export default function Features() {
 
const sectionRef = useScrollReveal()
  return (
    <section id="features" className="section" aria-labelledby="features-title" ref={sectionRef}>
      <h2 id="features-title">Everything a farm needs, in one place</h2>
      <p className="section-lead">
        These are the features of KrishiConnect AI. Market prices are demo data for now.
      </p>
      <ul className="feature-grid">
        {FEATURES.map((feature) => (
          <li key={feature.title} data-reveal>
            <article className="feature-card">
              <span className="badge">Available</span>
              <h3>{feature.title}</h3>
              <p>{feature.text}</p>
            </article>
          </li>
        ))}
      </ul>
    </section>
  )
}
