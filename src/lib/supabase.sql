-- ====================================
-- 0. REQUIRED EXTENSIONS
-- ====================================
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ====================================
-- 1. PROFILES TABLE (Users)
-- ====================================
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT NOT NULL,
  username TEXT NOT NULL UNIQUE,
  role TEXT NOT NULL CHECK (role IN ('student', 'teacher')),
  subject TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Enable RLS on profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "Allow users to insert own profile" ON profiles;
CREATE POLICY "Allow users to insert own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- ====================================
-- 2. COURSES TABLE
-- ====================================
CREATE TABLE IF NOT EXISTS courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'archived', 'draft')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE courses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Teachers can view own courses" ON courses;
CREATE POLICY "Teachers can view own courses" ON courses
  FOR SELECT USING (teacher_id = auth.uid());

DROP POLICY IF EXISTS "Teachers can create courses" ON courses;
CREATE POLICY "Teachers can create courses" ON courses
  FOR INSERT WITH CHECK (teacher_id = auth.uid());

DROP POLICY IF EXISTS "Teachers can update own courses" ON courses;
CREATE POLICY "Teachers can update own courses" ON courses
  FOR UPDATE USING (teacher_id = auth.uid());

-- ====================================
-- 3. COURSE_STUDENTS TABLE (Enrollment)
-- ====================================
CREATE TABLE IF NOT EXISTS course_students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  enrolled_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(course_id, student_id)
);

ALTER TABLE course_students ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their enrollments" ON course_students;
CREATE POLICY "Users can view their enrollments" ON course_students
  FOR SELECT USING (student_id = auth.uid());

DROP POLICY IF EXISTS "Teachers can view students in their courses" ON course_students;
CREATE POLICY "Teachers can view students in their courses" ON course_students
  FOR SELECT USING (
    course_id IN (SELECT id FROM courses WHERE teacher_id = auth.uid())
  );

-- ====================================
-- 4. COURSE_TOPICS TABLE
-- ====================================
CREATE TABLE IF NOT EXISTS course_topics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  order_index INT DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE course_topics ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view topics from their courses" ON course_topics;
CREATE POLICY "Users can view topics from their courses" ON course_topics
  FOR SELECT USING (
    course_id IN (
      SELECT id FROM courses WHERE teacher_id = auth.uid()
      UNION
      SELECT course_id FROM course_students WHERE student_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Teachers can manage own course topics" ON course_topics;
CREATE POLICY "Teachers can manage own course topics" ON course_topics
  FOR ALL USING (
    course_id IN (SELECT id FROM courses WHERE teacher_id = auth.uid())
  );

-- ====================================
-- 5. QUIZZES TABLE
-- ====================================
CREATE TABLE IF NOT EXISTS quizzes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE quizzes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view quizzes from their courses" ON quizzes;
CREATE POLICY "Users can view quizzes from their courses" ON quizzes
  FOR SELECT USING (
    course_id IN (
      SELECT id FROM courses WHERE teacher_id = auth.uid()
      UNION
      SELECT course_id FROM course_students WHERE student_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Teachers can manage own course quizzes" ON quizzes;
CREATE POLICY "Teachers can manage own course quizzes" ON quizzes
  FOR ALL USING (
    course_id IN (SELECT id FROM courses WHERE teacher_id = auth.uid())
  );

-- ====================================
-- 6. QUIZ_QUESTIONS TABLE
-- ====================================
CREATE TABLE IF NOT EXISTS quiz_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id UUID NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
  topic_id UUID REFERENCES course_topics(id) ON DELETE SET NULL,
  question_text TEXT NOT NULL,
  options TEXT[] NOT NULL,
  correct_option_index INT NOT NULL,
  published BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE quiz_questions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view quiz questions" ON quiz_questions;
CREATE POLICY "Users can view quiz questions" ON quiz_questions
  FOR SELECT USING (
    quiz_id IN (
      SELECT id FROM quizzes WHERE course_id IN (
        SELECT id FROM courses WHERE teacher_id = auth.uid()
        UNION
        SELECT course_id FROM course_students WHERE student_id = auth.uid()
      )
    )
  );

-- ====================================
-- 6. QUIZ_ATTEMPTS TABLE
-- ====================================
CREATE TABLE IF NOT EXISTS quiz_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id UUID NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  score DECIMAL(5,2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE quiz_attempts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Students can view own attempts" ON quiz_attempts;
CREATE POLICY "Students can view own attempts" ON quiz_attempts
  FOR SELECT USING (student_id = auth.uid());

DROP POLICY IF EXISTS "Students can create attempts" ON quiz_attempts;
CREATE POLICY "Students can create attempts" ON quiz_attempts
  FOR INSERT WITH CHECK (student_id = auth.uid());

DROP POLICY IF EXISTS "Teachers can view attempts for their course" ON quiz_attempts;
CREATE POLICY "Teachers can view attempts for their course" ON quiz_attempts
  FOR SELECT USING (
    quiz_id IN (SELECT id FROM quizzes WHERE course_id IN (SELECT id FROM courses WHERE teacher_id = auth.uid()))
  );

-- ====================================
-- 7. QUIZ_ANSWERS TABLE
-- ====================================
CREATE TABLE IF NOT EXISTS quiz_answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  attempt_id UUID NOT NULL REFERENCES quiz_attempts(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES quiz_questions(id) ON DELETE CASCADE,
  selected_option_index INT,
  is_correct BOOLEAN,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE quiz_answers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Students can view own answers" ON quiz_answers;
CREATE POLICY "Students can view own answers" ON quiz_answers
  FOR SELECT USING (
    attempt_id IN (SELECT id FROM quiz_attempts WHERE student_id = auth.uid())
  );

-- ====================================
-- 9. STUDENT_MASTERY TABLE
-- ====================================
CREATE TABLE IF NOT EXISTS student_mastery (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  topic_id UUID NOT NULL REFERENCES course_topics(id) ON DELETE CASCADE,
  mastery_level DECIMAL(3,1) DEFAULT 0,
  attempts_count INT DEFAULT 0,
  last_attempt TIMESTAMP WITH TIME ZONE,
  UNIQUE(student_id, topic_id)
);

ALTER TABLE student_mastery ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Students can view own mastery" ON student_mastery;
CREATE POLICY "Students can view own mastery" ON student_mastery
  FOR SELECT USING (student_id = auth.uid());

DROP POLICY IF EXISTS "Teachers can view students mastery" ON student_mastery;
CREATE POLICY "Teachers can view students mastery" ON student_mastery
  FOR SELECT USING (
    topic_id IN (SELECT id FROM course_topics WHERE course_id IN (SELECT id FROM courses WHERE teacher_id = auth.uid()))
  );

-- ====================================
-- 10. GRADES TABLE
-- ====================================
CREATE TABLE IF NOT EXISTS grades (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  score DECIMAL(5,2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE grades ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Students can view own grades" ON grades;
CREATE POLICY "Students can view own grades" ON grades
  FOR SELECT USING (student_id = auth.uid());

DROP POLICY IF EXISTS "Teachers can view students grades" ON grades;
CREATE POLICY "Teachers can view students grades" ON grades
  FOR SELECT USING (
    course_id IN (SELECT id FROM courses WHERE teacher_id = auth.uid())
  );

-- ====================================
-- 11. STUDENT_MESSAGES TABLE
-- ====================================
CREATE TABLE IF NOT EXISTS student_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  sender_role TEXT NOT NULL CHECK (sender_role IN ('teacher', 'student')),
  content TEXT NOT NULL,
  subject TEXT,
  sender_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  read_at TIMESTAMP WITH TIME ZONE
);

ALTER TABLE student_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view messages involving them" ON student_messages;
CREATE POLICY "Users can view messages involving them" ON student_messages
  FOR SELECT USING (auth.uid() = recipient_id OR auth.uid() = sender_id);

DROP POLICY IF EXISTS "Teachers can send messages to students" ON student_messages;
CREATE POLICY "Teachers can send messages to students" ON student_messages
  FOR INSERT WITH CHECK (
    sender_role = 'teacher'
    AND auth.uid() = sender_id
    AND recipient_id IN (SELECT id FROM profiles WHERE role = 'student')
  );

-- ====================================
-- TRIGGERS FOR updated_at
-- ====================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_courses_updated_at ON courses;
CREATE TRIGGER update_courses_updated_at BEFORE UPDATE ON courses
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_quizzes_updated_at ON quizzes;
CREATE TRIGGER update_quizzes_updated_at BEFORE UPDATE ON quizzes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_grades_updated_at ON grades;
CREATE TRIGGER update_grades_updated_at BEFORE UPDATE ON grades
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
