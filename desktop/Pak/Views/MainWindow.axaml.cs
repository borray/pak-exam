using System.Collections.Generic;
using System.Linq;
using Avalonia;
using Avalonia.Controls;
using Avalonia.Interactivity;
using Avalonia.Layout;
using Avalonia.Markup.Xaml;
using Avalonia.Media;
using Avalonia.Platform.Storage;
using Pak.Models;
using Pak.Services;

namespace Pak.Views;

public partial class MainWindow : Window
{
    private List<Exam> _exams = new();

    public MainWindow()
    {
        InitializeComponent();
        this.FindControl<Button>("NewBtn")!.Click += OnNew;
        this.FindControl<Button>("ImportBtn")!.Click += OnImport;
        Refresh();
    }

    private void InitializeComponent() => AvaloniaXamlLoader.Load(this);

    private void Refresh()
    {
        _exams = Storage.LoadExams();
        this.FindControl<TextBlock>("EmptyLabel")!.IsVisible = _exams.Count == 0;

        var rows = new List<Control>();
        foreach (var exam in _exams) rows.Add(BuildRow(exam));
        this.FindControl<ItemsControl>("ExamList")!.ItemsSource = rows;
    }

    private Control BuildRow(Exam exam)
    {
        var card = new Border
        {
            Background = Brush.Parse("#1e1e1e"),
            BorderBrush = Brush.Parse("#2a2a2a"),
            BorderThickness = new Thickness(1),
            Padding = new Thickness(14, 12),
            Margin = new Thickness(0, 0, 0, 8),
        };

        var grid = new Grid { ColumnDefinitions = new ColumnDefinitions("200,*,Auto") };

        var code = new TextBlock
        {
            Text = exam.Id,
            Foreground = Brush.Parse("#aaa"),
            FontFamily = new FontFamily("Consolas"),
            VerticalAlignment = VerticalAlignment.Center,
        };
        Grid.SetColumn(code, 0);

        var info = new StackPanel { VerticalAlignment = VerticalAlignment.Center };
        info.Children.Add(new TextBlock { Text = exam.Title, Foreground = Brush.Parse("#e5e5e0"), FontSize = 14 });
        info.Children.Add(new TextBlock { Text = $"{exam.Subject} · {exam.Institution} · вопросов: {exam.Questions.Count}", Foreground = Brush.Parse("#666"), FontSize = 12 });
        Grid.SetColumn(info, 1);

        var actions = new StackPanel { Orientation = Orientation.Horizontal, Spacing = 8, VerticalAlignment = VerticalAlignment.Center };
        actions.Children.Add(MakeBtn("Редактор", "#ccc", "#444", () => OpenEditor(exam)));
        actions.Children.Add(MakeBtn("Экспорт", "#888", "#333", () => OnExport(exam)));
        actions.Children.Add(MakeBtn("Удалить", "#a55", "#433", () => { Storage.DeleteExam(exam.Id); Refresh(); }));
        Grid.SetColumn(actions, 2);

        grid.Children.Add(code);
        grid.Children.Add(info);
        grid.Children.Add(actions);
        card.Child = grid;
        return card;
    }

    private static Button MakeBtn(string text, string fg, string border, System.Action onClick)
    {
        var b = new Button
        {
            Content = text,
            Background = Brushes.Transparent,
            Foreground = Brush.Parse(fg),
            BorderBrush = Brush.Parse(border),
            BorderThickness = new Thickness(1),
            Padding = new Thickness(10, 5),
        };
        b.Click += (_, _) => onClick();
        return b;
    }

    private void OnNew(object? sender, RoutedEventArgs e)
    {
        var exam = Defaults.NewExam(_exams);
        Storage.SaveExam(exam);
        OpenEditor(exam);
    }

    private void OpenEditor(Exam exam)
    {
        var win = new EditorWindow(exam);
        win.Closed += (_, _) => Refresh();
        win.Show();
    }

    private async void OnExport(Exam exam)
    {
        var file = await StorageProvider.SaveFilePickerAsync(new FilePickerSaveOptions
        {
            SuggestedFileName = exam.Id + ".pak.json",
            DefaultExtension = "json",
        });
        if (file is not null) Storage.ExportExam(exam, file.Path.LocalPath);
    }

    private async void OnImport(object? sender, RoutedEventArgs e)
    {
        var files = await StorageProvider.OpenFilePickerAsync(new FilePickerOpenOptions
        {
            AllowMultiple = false,
            FileTypeFilter = new[] { new FilePickerFileType("ПАК / JSON") { Patterns = new[] { "*.json" } } },
        });
        var first = files.FirstOrDefault();
        if (first is not null)
        {
            var exam = Storage.ImportExam(first.Path.LocalPath);
            if (exam is not null) { Storage.SaveExam(exam); Refresh(); }
        }
    }
}
