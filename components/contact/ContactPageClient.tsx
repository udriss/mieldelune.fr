'use client';

import { PageHeaderV2 } from '@/components/page-header-v2';
import ContactForm from '@/components/forms/contact-form';
import { Box } from '@mui/material';

type ContactPageClientProps = {
  unavailableDates: string[];
};

export default function ContactPageClient({ unavailableDates }: ContactPageClientProps) {
  return (
    <Box
      className="page-content-contact" // Classe CSS pour appliquer la personnalisation de police
      sx={{
        maxWidth: '800px',
        minWidth: '300px',
        mx: 'auto',
        mt: 16, // Equivalent to mt-32
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        borderRadius: '16px',
        padding: { xs: '1rem', md: '2rem' },
      }}
    >
      <PageHeaderV2 
        title="Contact"
        description={[
          "Prenons contact pour votre projet",
          "Contactez-nous pour des solutions innovantes et sur mesure !"
        ]}
      />
      <ContactForm unavailableDates={unavailableDates} />
    </Box>
  );
}
