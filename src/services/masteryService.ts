import { supabase } from '../lib/supabaseClient';

export async function calculateAndUpdateMastery(studentId: string, attemptId: string) {
  try {
    // 1. Get all answers for this attempt along with the topic associated with each question
    const { data: answers, error: aError } = await supabase
      .from('quiz_answers')
      .select(`
        is_correct,
        quiz_questions (
          topic_id
        )
      `)
      .eq('attempt_id', attemptId);

    if (aError) throw aError;

    // 2. Group results by topic
    const topicStats: Record<string, { correct: number, total: number }> = {};

    answers.forEach(ans => {
      const topicId = ans.quiz_questions?.[0]?.topic_id;
      if (topicId) {
        if (!topicStats[topicId]) {
          topicStats[topicId] = { correct: 0, total: 0 };
        }
        topicStats[topicId].total++;
        if (ans.is_correct) {
          topicStats[topicId].correct++;
        }
      }
    });

    // 3. Update student_mastery table
    const masteryUpdates = Object.entries(topicStats).map(([topicId, stats]) => ({
      student_id: studentId,
      topic_id: topicId,
      mastery_level: stats.correct / stats.total,
      last_updated: new Date().toISOString()
    }));

    const { error: mError } = await supabase
      .from('student_mastery')
      .upsert(masteryUpdates, { onConflict: 'student_id,topic_id' });

    if (mError) throw mError;

    return true;
  } catch (err) {
    console.error('Mastery Update Error:', err);
    throw err;
  }
}
