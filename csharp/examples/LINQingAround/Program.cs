using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace LINQingAround
{
    class Program
    {
        static void Main(string[] args)
        {
        }
        public static bool IsAnyWordUpperCase(IEnumerable<string> words)
        {
            return words.Any(word => word.All(char.IsUpper));
            //return words.Any(word => word.All(letter => char.IsUpper(letter)));
        }
        public static bool IsAnyNumberLargerThan100(IEnumerable<int> numbers)
        {
            return numbers.Any(number => number > 100);
        }   
        public static bool DoesAnyStringStartWithTheLetterP(IEnumerable<string> words)
        {
            return words.Any(word => word.StartsWith("P"));
        }
        public static bool IsAnyNumberEven(IEnumerable<int> numbers)
        {
            return numbers.Any(number => number % 2 == 0);
        }
        public static bool IsAnyNumberOdd(IEnumerable<int> numbers)
        {
            return numbers.Any(number => number % 2 != 0);
        }

        public static string FindFirstNameInTheCollection(IEnumerable<string> words)
        {
            return words.FirstOrDefault(w =>
                w.Length > 1 &&
                char.IsUpper(w.First()) &&
                w.Count(character => char.IsUpper(character)) == 1);
        }
    }
}
