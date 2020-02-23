#!/bin/bash

GIT_DIR="$(git rev-parse --git-dir)"
DESC="$GIT_DIR/COMMIT_EDITMSG"
BRANCH_NAME=$(git symbolic-ref --short HEAD)
TRIMMED=$(echo "$BRANCH_NAME" | sed -e 's:^\([^-]*-[^-]*\)-.*:\1:' -e\ 'y/abcdefghijklmnopqrstuvwxyz/ABCDEFGHIJKLMNOPQRSTUVWXYZ/')
COMMIT_REGEXP="^(revert: )?(feat|fix|docs|style|refactor|perf|test|chore)(\(.+\))?: (.{1,50})"
MESSAGE="$(cat $DESC)"

if [[ ! "$MESSAGE" =~ $COMMIT_REGEXP ]]; then
  echo "★ ☆ ★ ☆ ★ ☆ ★ ☆ ★ ☆ ★ ☆ ★ ☆ ★ ☆ ★ ☆ ★ ☆ ★ ☆ ★ ☆ ★ ☆ ★ ☆ ★ ☆ ★ ☆ ★ ☆ ★ ☆ ★ ☆
    \nas Your commit message is in invalid format, follow: https://www.conventionalcommits.org/en
    \n★ ☆ ★ ☆ ★ ☆ ★ ☆ ★ ☆ ★ ☆ ★ ☆ ★ ☆ ★ ☆ ★ ☆ ★ ☆ ★ ☆ ★ ☆ ★ ☆ ★ ☆ ★ ☆ ★ ☆ ★ ☆ ★ ☆\n"
  exit 1
fi

if [ -n "$BRANCH_NAME" ]
then
  if echo "$BRANCH_NAME" | grep -Eq '^(develop|master)$'
  then
    echo "${BASH_REMATCH[1]}${BASH_REMATCH[2]}${BASH_REMATCH[3]}: $BRANCH_NAME: ${BASH_REMATCH[4]}" > "$DESC"
  elif echo "$BRANCH_NAME" | grep -Eq '[a-zA-Z0-9]{2,}\-[0-9]+'
  then
    echo "${BASH_REMATCH[1]}${BASH_REMATCH[2]}${BASH_REMATCH[3]}: $TRIMMED: ${BASH_REMATCH[4]}" > "$DESC"
  else
    echo "★ ☆ ★ ☆ ★ ☆ ★ ☆ ★ ☆ ★ ☆ ★ ☆ ★ ☆ ★ ☆ ★ ☆ ★ ☆ ★ ☆ ★ ☆ ★ ☆ ★ ☆ ★ ☆ ★ ☆ ★ ☆ ★ ☆
    \nas your branch name is not in the right format, noting was prepend to your commit message
    \n★ ☆ ★ ☆ ★ ☆ ★ ☆ ★ ☆ ★ ☆ ★ ☆ ★ ☆ ★ ☆ ★ ☆ ★ ☆ ★ ☆ ★ ☆ ★ ☆ ★ ☆ ★ ☆ ★ ☆ ★ ☆ ★ ☆\n"
  fi
fi
