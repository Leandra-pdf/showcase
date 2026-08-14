// lib/rag.ts
import knowledgeBase from '@/data/knowledge-base.json';

export function searchKnowledgeBase(query: string, maxResults = 3) {
	const q = query.toLowerCase();

	const scored = knowledgeBase.map((entry) => {
		let score = 0;
		if (q.includes(entry.topic.toLowerCase())) score += 10;
		for (const keyword of entry.keywords) {
			if (q.includes(keyword.toLowerCase())) score += 5;
		}
		return { entry, score };
	});

	return scored
		.filter((s) => s.score > 0)
		.sort((a, b) => b.score - a.score)
		.slice(0, maxResults)
		.map((s) => s.entry);
}