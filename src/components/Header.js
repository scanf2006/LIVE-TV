import styles from './Header.module.css';

export default function Header() {
    return (
        <div className={styles.headerContainer}>
            <div className={styles.headerGlass}>
                <h1 className={styles.title}>
                    🌐 全球热点
                </h1>
                <p className={styles.subtitle}>
                    汇聚全球主要媒体实时资讯
                </p>
            </div>
        </div>
    );
}
