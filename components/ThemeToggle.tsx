import { TouchableOpacity } from 'react-native';

import { Moon, Sun } from 'lucide-react-native';
import { useColorScheme } from 'nativewind';

export function ThemeToggle() {
  const { colorScheme, setColorScheme } = useColorScheme();

  return (
    <TouchableOpacity onPress={() => setColorScheme(colorScheme === 'dark' ? 'light' : 'dark')}>
      {colorScheme === 'dark' ? (
        <Sun className="text-foreground" size={24} color={'#ffffff'} />
      ) : (
        <Moon className="text-foreground" size={24} />
      )}
    </TouchableOpacity>
  );
}
