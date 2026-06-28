import { auth, signOut } from '@/auth';
import { getConfig } from '@/lib/config/reader';
import { getStorageAdapter } from '@/lib/storage';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Grid';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import NextLink from '@/components/NextLink';

export default async function AdminPage() {
  const [session, config, images] = await Promise.all([
    auth(),
    getConfig(),
    getStorageAdapter().list().catch(() => []),
  ]);

  const lastUpdated = config.lastUpdated
    ? new Date(config.lastUpdated).toLocaleString()
    : 'Never';

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default', p: 4 }}>
      <Box sx={{ maxWidth: 900, mx: 'auto' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
          <Typography variant="h4" sx={{ fontWeight: 700 }}>
            Admin Dashboard
          </Typography>
          <form
            action={async () => {
              'use server';
              await signOut({ redirectTo: '/' });
            }}
          >
            <Button type="submit" variant="outlined" color="inherit">
              Sign Out
            </Button>
          </form>
        </Box>

        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid size={{ xs: 12, sm: 4 }}>
            <Card>
              <CardContent>
                <Typography variant="overline" color="text.secondary">
                  Images
                </Typography>
                <Typography variant="h3" color="primary" sx={{ fontWeight: 700 }}>
                  {images.length}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 12, sm: 4 }}>
            <Card>
              <CardContent>
                <Typography variant="overline" color="text.secondary">
                  Gallery Categories
                </Typography>
                <Typography variant="h3" color="primary" sx={{ fontWeight: 700 }}>
                  {config.gallery.categories.length}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 12, sm: 4 }}>
            <Card>
              <CardContent>
                <Typography variant="overline" color="text.secondary">
                  Last Updated
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 500, mt: 1 }}>
                  {lastUpdated}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        <Card>
          <CardContent sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                Site Editor
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Click &ldquo;Edit Site&rdquo; on the homepage to start editing inline
              </Typography>
            </Box>
            <Button
              component={NextLink}
              href="/"
              variant="contained"
              size="large"
            >
              Open Site
            </Button>
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
}
