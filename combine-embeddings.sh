# combines several json files into one
jq -s '.[0] + .[1]' embeddings500.json embeddings1000.json > merged.json
jq -s '.[0] + .[1]' merged.json embeddings1500.json > embeddings.json
jq -s '.[0] + .[1]' embeddings.json embeddings2000.json > merged.json
jq -s '.[0] + .[1]' merged.json embeddings2500.json > embeddings.json
jq -s '.[0] + .[1]' embeddings.json embeddings3000.json > merged.json
jq -s '.[0] + .[1]' merged.json embeddings3500.json > embeddings.json
jq -s '.[0] + .[1]' embeddings.json embeddings4000.json > merged.json
jq -s '.[0] + .[1]' merged.json embeddings4500.json > embeddings.json
jq -s '.[0] + .[1]' embeddings.json embeddings5000.json > merged.json
rm embeddings.json
mv merged.json embeddings.json