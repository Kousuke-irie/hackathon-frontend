import { Typography, Container, Button } from '@mui/material';
import { useNavigate } from 'react-router-dom';

export const NotFound = () => {
    const navigate = useNavigate();

    return (
        <Container component="main" maxWidth="md" style={{ textAlign: 'center', marginTop: '100px' }}>
            <Typography variant="h1" component="h1" gutterBottom>
                404
            </Typography>
            <Typography variant="h5" component="h2" gutterBottom>
                ページが見つかりません
            </Typography>
            <Typography variant="body1" >
                お探しのページは削除されたか、URLが変更された可能性があります。
            </Typography>
            <Button
                variant="contained"
                color="primary"
                onClick={() => navigate("/")}
            >
                トップページに戻る
            </Button>
        </Container>
    );
};