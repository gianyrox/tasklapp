import React from 'react';
import styles from './FeaturesSection.module.css';

const features = [
  {
    title: "Competitive Task Assignment",
    description: "Create challenges and assign tasks to team members with customizable difficulty levels.",
    color: "var(--primary)"
  },
  {
    title: "Real-time Performance Tracking",
    description: "Monitor completion rates, speed, and consistency with our racing-inspired dashboard.",
    color: "var(--secondary)"
  },
  {
    title: "Leaderboard Rankings",
    description: "Foster healthy competition with performance-based rankings and achievement badges.",
    color: "var(--success)"
  },
  {
    title: "Racing Analytics",
    description: "Gain insights with comprehensive statistics and visualize your productivity journey.",
    color: "var(--info)"
  }
];

const FeaturesSection: React.FC = () => {
  return (
    <section className={styles.features}>
      <h2 className={styles.sectionTitle}>Key Features</h2>
      <div className={styles.featureGrid}>
        {features.map((feature, index) => (
          <div key={index} className={styles.featureCard}>
            <div 
              className={styles.featureIcon} 
              style={{ backgroundColor: feature.color }}
            ></div>
            <h3>{feature.title}</h3>
            <p>{feature.description}</p>
          </div>
        ))}
      </div>
    </section>
  );
};

export default FeaturesSection; 