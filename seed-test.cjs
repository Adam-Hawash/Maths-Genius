
      const { PrismaClient } = require('@prisma/client');
      const p = new PrismaClient({ datasources: { db: { url: 'file:/home/z/maths-genius/db/custom.db' } } });
      (async () => {
        await p.playTicket.deleteMany({});
        const v = await p.video.create({ data: { title: 'درس تجريبي — سلحفاة البحر', url: 'https://res.cloudinary.com/demo/video/upload/v1689764251/samples/sea-turtle.mp4', grade: 'G7', price: 0 } });
        const t = await p.playTicket.create({ data: { id: 'tbrowser' + Date.now().toString(16), videoId: v.id, studentId: '', expiresAt: new Date(Date.now() + 300000) } });
        console.log(t.id);
        await p.$disconnect();
      })().catch((e) => { console.error(e); process.exit(1); });
    