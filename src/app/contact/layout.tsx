export const metadata = {
  title: 'Contact Us',
  description: 'Reach out to the Velora team for account questions, setup help, or general feedback. We are real people and we respond quickly.',
  alternates: {
    canonical: '/contact',
  },
  openGraph: {
    title: 'Contact Us — Velora',
    description: 'Get in touch with the Velora team for support, feedback, or general questions.',
    url: '/contact',
  },
};

export default function ContactLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
