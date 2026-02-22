import Link from 'next/link';
import styles from './Header.module.css';

export default function Header() {
    return (
        <div className={styles.headerContainer}>
            <div className={styles.headerGlass}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                    <div>
                        <h1 className={styles.title} style={{ fontSize: '1.2rem', opacity: 0.8 }}>
                            Live Television
                        </h1>
                    </div>
                    <Link href="/iptv" className={styles.iptvButton}>
                        📺 加拿大直播
                    </Link>
                </div>
            </div>
        </div>
    );
}
