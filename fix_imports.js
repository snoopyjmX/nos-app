const fs = require('fs');
let login = fs.readFileSync('src/app/(auth)/login.tsx', 'utf8');

// revert the first bad replace
login = login.replace("import {\n  ActivityIndicator, useState, useEffect } from 'react';", "import { useState, useEffect } from 'react';");
login = login.replace("import {\n  ActivityIndicator, View,", "import { View, ActivityIndicator,");
fs.writeFileSync('src/app/(auth)/login.tsx', login);

