```bash
echo adrienbrault/nous-hermes2pro-llama3-8b:{q4_K_M,q5_K_M,q6_K,q8_0} | xargs -n 1 ollama pull
ollama -v ; bun run index.ts
```

-> https://app.warp.dev/block/KglnkAHa2gFsLP4IX3Jtyi