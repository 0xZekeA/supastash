import useBaseUrl from "@docusaurus/useBaseUrl";
import type { ReactNode } from "react";
import styles from "./styles.module.css";

type FeatureItem = {
  title: string;
  img: string;
  description: ReactNode;
};

const FeatureList: FeatureItem[] = [
  {
    title: "Local-First Sync Engine",
    img: "/img/sync-sm.png",
    description: (
      <>
        Supastash adds seamless offline-first support to your app, with smart,
        conflict-aware syncing between local SQLite and Supabase — so your data
        stays consistent whether you're online or not.
      </>
    ),
  },
  {
    title: "Pluggable & Lightweight",
    img: "/img/compatible-sm.png",
    description: (
      <>
        Use any SQLite engine — Expo,RN Nitro, or RN Storage — without changing
        your app logic. Supastash is modular by design and optimized for
        performance at its core.
      </>
    ),
  },
  {
    title: "Instant Supabase Integration",
    img: "/img/fast-sm.png",
    description: (
      <>
        Just point to your Supabase tables, set your filters, and go. Supastash
        handles both remote and local logic behind the scenes — with zero
        boilerplate and full type safety.
      </>
    ),
  },
];

function Feature({ title, img, description }: FeatureItem) {
  return (
    <div className={styles.featureCard}>
      <div className={styles.iconWrapper}>
        <img src={useBaseUrl(img)} alt={title} className={styles.featureIcon} />
      </div>
      <div className={styles.textWrapper}>
        <h3 className={styles.featureTitle}>{title}</h3>
        <p className={styles.featureDescription}>{description}</p>
      </div>
    </div>
  );
}

export default function HomepageFeatures(): ReactNode {
  return (
    <section className={styles.features}>
      <div className="container">
        <div className="row">
          {FeatureList.map((props, idx) => (
            <Feature key={idx} {...props} />
          ))}
        </div>
      </div>
    </section>
  );
}
