const express = require('express');
const cors = require('cors');
const Queue = require('bull');
const app = express();

app.use(cors({
  origin: 'http://localhost:3000' // Nuxt.jsフロントエンドのオリジン
}));

// 特定のHTTPメソッドに対してCORSを許可する場合
app.use(cors({
  methods: ['GET', 'POST', 'PUT', 'DELETE']
}));

// Redis接続設定（デフォルトのlocalhost:6379を使用）
const jobQueue = new Queue('processing-queue');

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

 // JSONボディの解析を有効化
app.use(express.json());

// ジョブをキューに追加するエンドポイント
app.post('/enqueue', async (req, res) => {
  try {
    // ジョブデータ（リクエストボディから取得）
    console.log('リクエストボディ:', req.body);
    const jobData = req.body;
    // ジョブをキューに追加
    const job = await jobQueue.add(jobData);
    // ジョブIDをレスポンスとして返す
    res.json({ jobId: job.id });
  } catch (error) {
    console.error('ジョブの追加に失敗しました:', error);
    res.status(500).send('ジョブの追加に失敗しました');
  }
});

// ジョブの状態を確認するエンドポイント
app.get('/status/:jobId', async (req, res) => {
  try {
    const jobId = req.params.jobId;
    const job = await jobQueue.getJob(jobId);
    if (job === null) {
      res.status(404).send('ジョブが見つかりません');
    } else {
      // ジョブの状態を取得
      const state = await job.getState();
      // ジョブの状態をレスポンスとして返す
      res.json({ jobId: jobId, state: state });
    }
  } catch (error) {
    console.error('ジョブの状態の取得に失敗しました:', error);
    res.status(500).send('ジョブの状態の取得に失敗しました');
  }
});

// ジョブ処理関数（ここに重たい処理を実装）
jobQueue.process(async (job) => {
  console.log(`Processing job ${job.id}`);
  console.log(job.data);

  // ここにジョブの処理ロジックを実装
  await sleep(10000);

  console.log(`Process completed job ${job.id}`);
});

const PORT = process.env.PORT || 8000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
