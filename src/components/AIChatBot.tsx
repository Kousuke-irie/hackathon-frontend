import { useState, useRef, useEffect } from 'react';
import { Fab, Drawer, TextField, IconButton, Box, Typography, Paper, CircularProgress, Avatar } from '@mui/material';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import SendIcon from '@mui/icons-material/Send';
import CloseIcon from '@mui/icons-material/Close';
import * as api from '../services/api';
import logoImg from "../assets/logo.png";

export const AIChatBot = () => {
    const [open, setOpen] = useState(false);
    const [input, setInput] = useState('');
    const [chatLog, setChatLog] = useState<{ role: 'user' | 'ai', text: string }[]>([
        { role: 'ai', text: 'こんにちは！Wishコンシェルジュです。アプリの使い方や探し方など、何でも聞いてくださいね。' }
    ]);
    const [loading, setLoading] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [chatLog]);

    const handleSend = async () => {
        if (!input.trim() || loading) return;

        const userMsg = input;
        setChatLog(prev => [...prev, { role: 'user', text: userMsg }]);
        setInput('');
        setLoading(true);

        try {
            const answer = await api.askAIConcierge(userMsg);
            setChatLog(prev => [...prev, { role: 'ai', text: answer }]);
        } catch (err) {
            setChatLog(prev => [...prev, { role: 'ai', text: '申し訳ありません。エラーが発生しました。' }]);
            console.log(err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <Fab
                color="primary"
                onClick={() => setOpen(true)}
                sx={{ position: 'fixed', bottom: 24, right: 24, bgcolor: '#1a1a1a', '&:hover': { bgcolor: '#333' }, zIndex: 1000 }}
            >
                <SmartToyIcon />
            </Fab>

            <Drawer anchor="right" open={open} onClose={() => setOpen(false)} slotProps={{paper: {sx: { width: { xs: '100%', sm: 360 } }}}}>
                <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                    {/* ヘッダー */}
                    <Box sx={{ p: 2, bgcolor: '#1a1a1a', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Avatar src={logoImg} sx={{ width: 24, height: 24 }} />
                            <Typography sx={{ fontWeight: 'bold' }}>Wish コンシェルジュ</Typography>
                        </Box>
                        <IconButton onClick={() => setOpen(false)} sx={{ color: '#fff' }}><CloseIcon /></IconButton>
                    </Box>

                    {/* チャットエリア */}
                    <Box sx={{ flexGrow: 1, overflowY: 'auto', p: 2, bgcolor: '#f8f9fa' }}>
                        {chatLog.map((log, i) => (
                            <Box key={i} sx={{ display: 'flex', justifyContent: log.role === 'user' ? 'flex-end' : 'flex-start', mb: 2 }}>
                                <Paper elevation={0} sx={{
                                    p: 1.5,
                                    maxWidth: '85%',
                                    borderRadius: log.role === 'user' ? '18px 18px 2px 18px' : '18px 18px 18px 2px',
                                    bgcolor: log.role === 'user' ? '#1a1a1a' : '#fff',
                                    color: log.role === 'user' ? '#fff' : '#1a1a1a',
                                    border: log.role === 'ai' ? '1px solid #eee' : 'none'
                                }}>
                                    <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>{log.text}</Typography>
                                </Paper>
                            </Box>
                        ))}
                        {loading && (
                            <Box sx={{ display: 'flex', ml: 1 }}><CircularProgress size={16} color="inherit" /></Box>
                        )}
                        <div ref={scrollRef} />
                    </Box>

                    {/* 入力エリア */}
                    <Box sx={{ p: 2, borderTop: '1px solid #eee', display: 'flex', gap: 1 }}>
                        <TextField
                            fullWidth
                            size="small"
                            placeholder="使い方を聞く..."
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                        />
                        <IconButton onClick={handleSend} color="primary" disabled={!input.trim() || loading}>
                            <SendIcon />
                        </IconButton>
                    </Box>
                </Box>
            </Drawer>
        </>
    );
};