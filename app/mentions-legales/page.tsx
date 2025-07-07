import Container from '@mui/material/Container';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import Divider from '@mui/material/Divider';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import Box from '@mui/material/Box';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Mentions légales | MielDeLune',
  description: 'Mentions légales, informations sur l\'éditeur du site et conditions d\'utilisation.',
};

export default function MentionsLegalesPage() {
  return (
    <Container maxWidth="md" sx={{ py: { xs: 4, md: 8 }, mt: { xs: 6, md: 16 }, mb: { xs: 4, md: 8 }, background: '#fff0f6', borderRadius: 6 }}>
      <Paper elevation={3} sx={{ borderRadius: 4, p: { xs: 3, md: 6 }, background: 'linear-gradient(135deg, #fff 70%, #ffe4ec 100%)', boxShadow: '0 8px 32px 0 rgba(255,182,193,0.15)', border: '1.5px solid #f8bbd0' }}>
        <Typography variant="h2" component="h1" gutterBottom align="center" sx={{ fontWeight: 'bold', color: '#c60042', mb: 4, fontFamily: 'Playfair Display, Roboto, Arial' }}>
          Mentions légales
        </Typography>
        <Divider sx={{ mb: 4, borderColor: '#f8bbd0' }} />
        <Box component="section" mb={5} sx={{ background: '#fff7fa', borderRadius: 3, p: 2 }}>
        <Typography variant="h4" component="h2" sx={{ color: '#b67907', fontWeight: 600, mb: 1, textTransform: 'uppercase', fontSize: '1.5rem', letterSpacing: 1 }}>
            Éditeur du site
          </Typography>
          <Typography variant="body1">MIEL DE LUNE</Typography>
          {/* <Typography variant="body1">Représenté par SlyceMind</Typography> */}
          <Typography variant="body1">Adresse : Rue St Louis en l’Île 75004</Typography>
          <Typography variant="body1">Email : photoxpro@outlook.fr</Typography>
        </Box>
        <Divider sx={{ mb: 4, borderColor: '#f8bbd0' }} />
        <Box component="section" mb={5} sx={{ background: '#fff7fa', borderRadius: 3, p: 2 }}>
        <Typography variant="h4" component="h2" sx={{ color: '#b67907', fontWeight: 600, mb: 1, textTransform: 'uppercase', fontSize: '1.5rem', letterSpacing: 1 }}>
            Protection des données
          </Typography>
          <Typography variant="body1" mb={1}>Conformément au RGPD, nous collectons et traitons vos données pour :</Typography>
          <List sx={{ pl: 2 }}>
            <ListItem sx={{ display: 'list-item', pl: 2 }}>
              <ListItemText primary="Gérer vos réservations et paiements" />
            </ListItem>
            <ListItem sx={{ display: 'list-item', pl: 2 }}>
              <ListItemText primary="Vous contacter concernant vos demandes" />
            </ListItem>
            <ListItem sx={{ display: 'list-item', pl: 2 }}>
              <ListItemText primary="Améliorer nos services" />
            </ListItem>
          </List>
        </Box>
        <Divider sx={{ mb: 4, borderColor: '#f8bbd0' }} />
        <Box component="section" mb={5} sx={{ background: '#fff7fa', borderRadius: 3, p: 2 }}>
          <Typography variant="h4" component="h2" sx={{ color: '#b67907', fontWeight: 600, mb: 1, textTransform: 'uppercase', fontSize: '1.5rem', letterSpacing: 1 }}>
            Propriété intellectuelle
          </Typography>
          <Typography variant="body1">L'ensemble du contenu du site (photos, textes, logo) est protégé par le droit d'auteur.</Typography>
          <Typography variant="body1" sx={{ mt: 1 }}>
            © {new Date().getFullYear()} <Box component="span" sx={{ color: '#c60042', fontWeight: 700 }}>MIEL DE LUNE</Box> - Tous droits réservés
          </Typography>
        </Box>
        <Divider sx={{ mb: 4, borderColor: '#f8bbd0' }} />
        <Box component="section" sx={{ background: '#fff7fa', borderRadius: 3, p: 2 }}>
        <Typography variant="h4" component="h2" sx={{ color: '#b67907', fontWeight: 600, mb: 1, textTransform: 'uppercase', fontSize: '1.5rem', letterSpacing: 1 }}>
            Contactez-nous
          </Typography>
          <Typography variant="body1">Pour toute question concernant vos données personnelles :</Typography>
          <Typography variant="body1">Email : contact@sekrane.fr</Typography>
          <Typography variant="body1">Délai de réponse : 30 jours maximum</Typography>
        </Box>
      </Paper>
    </Container>
  );
}
