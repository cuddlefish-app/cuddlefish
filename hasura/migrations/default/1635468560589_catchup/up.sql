SET check_function_bodies = false;
CREATE FUNCTION public.set_current_timestamp_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
  _new record;
BEGIN
  _new := NEW;
  _new."updated_at" = NOW();
  RETURN _new;
END;
$$;
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
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    body text NOT NULL,
    thread_id uuid NOT NULL,
    author_github_node_id text NOT NULL
);
COMMENT ON TABLE public.comments IS 'TODO: make author_github_id nullable and add author_email. Add constraint that exactly one of them is present.';
COMMENT ON COLUMN public.comments.author_github_node_id IS 'The GitHub node id of the user who authored this comment.';
CREATE TABLE public.github_users (
    github_username text NOT NULL,
    email text NOT NULL,
    github_database_id integer NOT NULL,
    github_node_id text NOT NULL,
    github_name text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    access_token text NOT NULL
);
COMMENT ON TABLE public.github_users IS 'Every time a user logs in these values get upserted. Users can also be created implicitly by receiving email responses from them.';
COMMENT ON COLUMN public.github_users.email IS 'User''s email according to their GitHub account. We assume that all GitHub accounts have an email associated with it.';
COMMENT ON COLUMN public.github_users.github_database_id IS 'An integer id that GitHub gives every user. Use github_node_id instead whenever possible.';
COMMENT ON COLUMN public.github_users.github_node_id IS 'Eg., "MDQ6VXNlcjIyNjg3Mg==". Seems to be used in the v4 GraphQL GitHub API.';
COMMENT ON COLUMN public.github_users.github_name IS 'User''s name according to GitHub, eg. "Barack Obama".';
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
    original_line_number integer NOT NULL
);
COMMENT ON TABLE public.threads IS 'All threads. There''s no constraint that there are comments for each thread. There is a UNIQUE constraint on  (commit, file, line). There''s no constraint that (commit, file_path, line_number) be in the blamelines table. However, there is a foreign key relationship with the lines table.';
CREATE TABLE public.user_sessions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    user_github_node_id text NOT NULL
);
COMMENT ON TABLE public.user_sessions IS 'Note that every session necessarily requires logging in with GitHub, so user_github_node_id is not nullable.';
COMMENT ON COLUMN public.user_sessions.id IS 'Also used as "session token".';
COMMENT ON COLUMN public.user_sessions.user_github_node_id IS 'The GitHub node id of the user associated with this session. Not unique since a single user may have multiple sessions.';
ALTER TABLE ONLY public.blamelines
    ADD CONSTRAINT blamelines_pkey PRIMARY KEY (x_commit, x_file_path, x_line_number);
ALTER TABLE ONLY public.comments
    ADD CONSTRAINT comments_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.github_users
    ADD CONSTRAINT github_users_access_token_key UNIQUE (access_token);
ALTER TABLE ONLY public.lines
    ADD CONSTRAINT lines_pkey PRIMARY KEY (commit, file_path, line_number);
ALTER TABLE ONLY public.threads
    ADD CONSTRAINT threads_original_commit_original_file_path_original_line_number UNIQUE (original_commit, original_file_path, original_line_number);
ALTER TABLE ONLY public.threads
    ADD CONSTRAINT threads_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.user_sessions
    ADD CONSTRAINT user_sessions_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.github_users
    ADD CONSTRAINT users_github_email_key UNIQUE (email);
ALTER TABLE ONLY public.github_users
    ADD CONSTRAINT users_github_id_key UNIQUE (github_database_id);
ALTER TABLE ONLY public.github_users
    ADD CONSTRAINT users_github_node_id_key UNIQUE (github_node_id);
ALTER TABLE ONLY public.github_users
    ADD CONSTRAINT users_github_username_key UNIQUE (github_username);
ALTER TABLE ONLY public.github_users
    ADD CONSTRAINT users_pkey PRIMARY KEY (github_node_id);
CREATE TRIGGER set_public_users_updated_at BEFORE UPDATE ON public.github_users FOR EACH ROW EXECUTE FUNCTION public.set_current_timestamp_updated_at();
COMMENT ON TRIGGER set_public_users_updated_at ON public.github_users IS 'trigger to set value of column "updated_at" to current timestamp on row update';
ALTER TABLE ONLY public.blamelines
    ADD CONSTRAINT blamelines_original_line_number_original_file_path_original_ FOREIGN KEY (original_line_number, original_file_path, original_commit) REFERENCES public.lines(line_number, file_path, commit) ON UPDATE RESTRICT ON DELETE RESTRICT;
ALTER TABLE ONLY public.comments
    ADD CONSTRAINT comments_author_github_node_id_fkey FOREIGN KEY (author_github_node_id) REFERENCES public.github_users(github_node_id) ON UPDATE RESTRICT ON DELETE RESTRICT;
ALTER TABLE ONLY public.comments
    ADD CONSTRAINT comments_thread_id_fkey FOREIGN KEY (thread_id) REFERENCES public.threads(id) ON UPDATE RESTRICT ON DELETE RESTRICT;
ALTER TABLE ONLY public.threads
    ADD CONSTRAINT threads_original_line_number_original_file_path_original_com FOREIGN KEY (original_line_number, original_file_path, original_commit) REFERENCES public.lines(line_number, file_path, commit) ON UPDATE RESTRICT ON DELETE RESTRICT;
ALTER TABLE ONLY public.user_sessions
    ADD CONSTRAINT user_sessions_user_github_node_id_fkey FOREIGN KEY (user_github_node_id) REFERENCES public.github_users(github_node_id) ON UPDATE RESTRICT ON DELETE RESTRICT;
