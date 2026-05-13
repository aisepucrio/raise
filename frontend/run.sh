npm install

if [ "$IS_DEBUG" = "False" ]; then
    npm run start
else
    npm run dev
fi