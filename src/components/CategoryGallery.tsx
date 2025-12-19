import { useEffect, useState } from 'react';
import { Box, Typography, List, ListItemButton, ListItemText, Paper } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import * as api from '../services/api';

export const CategoryGallery = () => {
    const [categories, setCategories] = useState<api.CategoryTree[]>([]);
    const navigate = useNavigate();

    useEffect(() => {
        api.fetchCategoryTree().then(setCategories);
    }, []);

    return (
        <Box sx={{ maxWidth: 900, mx: 'auto', py: 4, px: 2 }}>
            <Typography variant="h5" sx={{ fontWeight: 800, mb: 4, textAlign: 'center' }}>
                カテゴリーから探す
            </Typography>

            {/* Gridコンポーネントの代わりにBoxのCSS Gridを使用 */}
            <Box sx={{
                display: 'grid',
                gap: 3,
                gridTemplateColumns: {
                    xs: '1fr',
                    sm: '1fr 1fr',
                    md: '1fr 1fr 1fr'
                }
            }}>
                {categories.map((cat) => (
                    <Box key={cat.id}>
                        <Paper variant="outlined" sx={{ borderRadius: 3, overflow: 'hidden', height: '100%' }}>
                            <Box sx={{ bgcolor: '#f5f5f5', p: 1.5 }}>
                                <Typography sx={{ fontWeight: 'bold' }}>{cat.name}</Typography>
                            </Box>
                            <List dense>
                                <ListItemButton onClick={() => navigate(`/?cat=${cat.id}`)}>
                                    <ListItemText primary="すべて" />
                                </ListItemButton>
                                {cat.children?.map(sub => (
                                    <ListItemButton key={sub.id} onClick={() => navigate(`/?cat=${sub.id}`)}>
                                        <ListItemText primary={sub.name} />
                                    </ListItemButton>
                                ))}
                            </List>
                        </Paper>
                    </Box>
                ))}
            </Box>
        </Box>
    );
};