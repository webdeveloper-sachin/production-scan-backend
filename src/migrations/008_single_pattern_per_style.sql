-- Ek style ka ek hi pattern. Multiple ho to sabse naya (highest id) rakha jata hai.
DELETE FROM style_and_pattern_mapping m
USING style_and_pattern_mapping newer
WHERE m.style_number = newer.style_number AND m.id < newer.id;

CREATE UNIQUE INDEX IF NOT EXISTS uq_style_single_pattern ON style_and_pattern_mapping(style_number);
