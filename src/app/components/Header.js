import { MessageSquare } from 'lucide-react';
import Link from 'next/link';
import config from '../../config';

export default function Header() {
    return (
        <header className="site-header">
            <Link href="/" className="header-logo" style={{ textDecoration: 'none', color: 'inherit', cursor: 'pointer' }}>
                <MessageSquare className="logo-icon" />
                <span>{config.header.logoText}</span>
            </Link>
        </header>
    );
}
