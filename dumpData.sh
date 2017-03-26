mongoexport --jsonArray --pretty -h 127.0.0.1 --port 3001 -d meteor -c questions -o ./data_questions.json
mongoexport --jsonArray --pretty -h 127.0.0.1 --port 3001 -d meteor -c s_data -o ./data_questions_obj.json
mongoexport --jsonArray --pretty -h 127.0.0.1 --port 3001 -d meteor -c s_status -o ./data_subjects.json
mongoexport --jsonArray --pretty -h 127.0.0.1 --port 3001 -d meteor -c ts.assignments -o ./data_assignments.json
