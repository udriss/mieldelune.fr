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
  title: 'Politique de Cookies | MielDeLune',
  description: 'Politique de confidentialité et utilisation des cookies sur notre site de photographie de mariage.',
};

export default function CookiesPage() {
  return (
    <Container maxWidth="md" sx={{ py: { xs: 4, md: 8 }, mt: { xs: 6, md: 16 }, mb: { xs: 4, md: 8 }, background: '#fff0f6', borderRadius: 6 }}>
      <Paper elevation={3} sx={{ borderRadius: 4, p: { xs: 3, md: 6 }, background: 'linear-gradient(135deg, #fff 70%, #ffe4ec 100%)', boxShadow: '0 8px 32px 0 rgba(255,182,193,0.15)', border: '1.5px solid #f8bbd0' }}>
        <Typography variant="h2" component="h1" gutterBottom align="center" sx={{ fontWeight: 'bold', color: '#c60042', mb: 4, fontFamily: 'Playfair Display, Roboto, Arial' }}>
          Politique de Cookies
        </Typography>
        <Divider sx={{ mb: 4, borderColor: '#f8bbd0' }} />
        <Box component="section" mb={5} sx={{ background: '#fff7fa', borderRadius: 3, p: 2 }}>
        <Typography variant="h4" component="h2" sx={{ color: '#b67907', fontWeight: 600, mb: 1, textTransform: 'uppercase', fontSize: '1.5rem', letterSpacing: 1 }}>
            Utilisation des Cookies
          </Typography>
          <Typography variant="body1">Le site MielDeLune utilise des cookies pour les finalités suivantes :</Typography>
          <List sx={{ pl: 2 }}>
            <ListItem sx={{ display: 'list-item', pl: 2 }}>
              <ListItemText primary={<><strong>Cookies de paiement (PayPal)</strong> - Nécessaires pour traiter vos paiements en toute sécurité</>} />
            </ListItem>
            <ListItem sx={{ display: 'list-item', pl: 2 }}>
              <ListItemText primary={<><strong>Cookies de session</strong> - Essentiels pour la navigation et l'authentification</>} />
            </ListItem>
            <ListItem sx={{ display: 'list-item', pl: 2 }}>
              <ListItemText primary={<><strong>Cookies de préférences</strong> - Mémorisent vos choix d'affichage</>} />
            </ListItem>
          </List>
        </Box>
        <Divider sx={{ mb: 4, borderColor: '#f8bbd0' }} />
        <Box component="section" mb={5} sx={{ background: '#fff7fa', borderRadius: 3, p: 2 }}>
        <Typography variant="h4" component="h2" sx={{ color: '#b67907', fontWeight: 600, mb: 1, textTransform: 'uppercase', fontSize: '1.5rem', letterSpacing: 1 }}>
            Durée de conservation
          </Typography>
          <List sx={{ pl: 2 }}>
            <ListItem sx={{ display: 'list-item', pl: 2 }}>
              <ListItemText primary="Cookies de session : Supprimés à la fermeture du navigateur" />
            </ListItem>
            <ListItem sx={{ display: 'list-item', pl: 2 }}>
              <ListItemText primary="Cookies de paiement : 13 mois maximum" />
            </ListItem>
            <ListItem sx={{ display: 'list-item', pl: 2 }}>
              <ListItemText primary="Cookies de préférences : 6 mois maximum" />
            </ListItem>
          </List>
        </Box>
        <Divider sx={{ mb: 4, borderColor: '#f8bbd0' }} />
        <Box component="section" mb={5} sx={{ background: '#fff7fa', borderRadius: 3, p: 2 }}>
        <Typography variant="h4" component="h2" sx={{ color: '#b67907', fontWeight: 600, mb: 1, textTransform: 'uppercase', fontSize: '1.5rem', letterSpacing: 1 }}>
            Vos droits
          </Typography>
          <Typography variant="body1">Conformément au RGPD, vous pouvez :</Typography>
          <List sx={{ pl: 2 }}>
            <ListItem sx={{ display: 'list-item', pl: 2 }}>
              <ListItemText primary="Accepter ou refuser les cookies non essentiels" />
            </ListItem>
            <ListItem sx={{ display: 'list-item', pl: 2 }}>
              <ListItemText primary="Modifier vos préférences à tout moment" />
            </ListItem>
            <ListItem sx={{ display: 'list-item', pl: 2 }}>
              <ListItemText primary="Supprimer les cookies existants via les paramètres de votre navigateur" />
            </ListItem>
          </List>
        </Box>
        <Divider sx={{ mb: 4, borderColor: '#f8bbd0' }} />
        <Box component="section" sx={{ background: '#fff7fa', borderRadius: 3, p: 2 }}>
        <Typography variant="h4" component="h2" sx={{ color: '#b67907', fontWeight: 600, mb: 1, textTransform: 'uppercase', fontSize: '1.5rem', letterSpacing: 1 }}>
            Paramètres des Cookies
          </Typography>
          <Typography variant="body1">Pour gérer vos cookies :</Typography>
          <List sx={{ pl: 2 }}>
            <ListItem sx={{ display: 'list-item', pl: 2 }}>
              <ListItemText primary="Chrome : Menu → Paramètres → Confidentialité et sécurité" />
            </ListItem>
            <ListItem sx={{ display: 'list-item', pl: 2 }}>
              <ListItemText primary="Firefox : Menu → Options → Vie privée et sécurité" />
            </ListItem>
            <ListItem sx={{ display: 'list-item', pl: 2 }}>
              <ListItemText primary="Safari : Préférences → Confidentialité" />
            </ListItem>
          </List>
        </Box>
      </Paper>
    </Container>
  );
}