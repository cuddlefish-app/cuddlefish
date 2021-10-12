CREATE TABLE public.blamelines (
    original_commit text NOT NULL,
    original_file_path text NOT NULL,
    original_line_number integer NOT NULL,
    x_commit text NOT NULL,
    x_file_path text NOT NULL,
    x_line_number integer NOT NULL,
    CONSTRAINT "original_line_number > 0" CHECK ((original_line_number > 0)),
    CONSTRAINT "x_line_number > 0" CHECK ((x_line_number > 0))
);
COMMENT ON TABLE public.blamelines IS 'Matches lines to their original sources via git blame information.';
CREATE TABLE public.comments (
    id uuid DEFAULT public.gen_random_uuid() NOT NULL,
    author_id text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    body text NOT NULL,
    thread_id uuid NOT NULL
);
CREATE TABLE public.lines (
    commit text NOT NULL,
    file_path text NOT NULL,
    line_number integer NOT NULL,
    CONSTRAINT "line numbers > 0" CHECK ((line_number > 0))
);
COMMENT ON TABLE public.lines IS 'Uniquely identifies a line of code anywhere in the git universe.';
CREATE TABLE public.threads (
    id uuid DEFAULT public.gen_random_uuid() NOT NULL,
    original_commit text NOT NULL,
    original_file_path text NOT NULL,
    original_line_number integer NOT NULL,
    resolved boolean DEFAULT false
);
COMMENT ON TABLE public.threads IS 'All threads. There''s no constraint that there are comments for each thread. There is a constraint however that you can''t have two threads on the same (file, line, commit).';
CREATE TABLE public.users (
    id text NOT NULL,
    github_username text NOT NULL
);
COMMENT ON TABLE public.users IS 'Every time a user logs in these values get upserted.';
ALTER TABLE ONLY public.blamelines
    ADD CONSTRAINT blamelines_pkey PRIMARY KEY (x_commit, x_file_path, x_line_number);
ALTER TABLE ONLY public.comments
    ADD CONSTRAINT comments_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.lines
    ADD CONSTRAINT lines_pkey PRIMARY KEY (commit, file_path, line_number);
ALTER TABLE ONLY public.threads
    ADD CONSTRAINT threads_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_github_username_key UNIQUE (github_username);
ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.blamelines
    ADD CONSTRAINT blamelines_original_line_number_original_file_path_original_ FOREIGN KEY (original_line_number, original_file_path, original_commit) REFERENCES public.lines(line_number, file_path, commit) ON UPDATE RESTRICT ON DELETE RESTRICT;
ALTER TABLE ONLY public.comments
    ADD CONSTRAINT comments_author_id_fkey FOREIGN KEY (author_id) REFERENCES public.users(id) ON UPDATE RESTRICT ON DELETE RESTRICT;
ALTER TABLE ONLY public.comments
    ADD CONSTRAINT comments_thread_id_fkey FOREIGN KEY (thread_id) REFERENCES public.threads(id) ON UPDATE RESTRICT ON DELETE RESTRICT;
ALTER TABLE ONLY public.threads
    ADD CONSTRAINT threads_original_line_number_original_file_path_original_com FOREIGN KEY (original_line_number, original_file_path, original_commit) REFERENCES public.lines(line_number, file_path, commit) ON UPDATE RESTRICT ON DELETE RESTRICT;
